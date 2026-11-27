create function public.admin_submission_review(actor uuid, link_ids uuid[]) returns jsonb
language plpgsql set search_path = '' as $$
declare
  result jsonb;
begin
  perform public.require_admin(actor,'content');
  if cardinality(link_ids)=0 or cardinality(link_ids)>101 or
    (select count(distinct x) from unnest(link_ids) as x)<>cardinality(link_ids) then raise invalid_parameter_value; end if;
  select jsonb_agg(jsonb_build_object(
    'submission', public.submission_snapshot(l.id),
    'base', public.content_data(l.kind,l.base_revision_id),
    'current', (select p from public.published_content(l.kind,coalesce(l.project_id,l.review_id,l.organizer_id)) p
      where coalesce(l.project_id,l.review_id,l.organizer_id) is not null),
    'editor', (select p from public.editable_content(actor,l.kind,coalesce(l.project_id,l.review_id,l.organizer_id)) p
      where coalesce(l.project_id,l.review_id,l.organizer_id) is not null),
    'archived', l.organizer_archived
  ) order by l.kind='project' desc,l.id)
  into result from public.content_submission_links l
  where l.id=any(link_ids) and l.submitted_at is not null
    and not exists(select 1 from public.content_submission_decisions d where d.link_id=l.id);
  if coalesce(jsonb_array_length(result),0)<>cardinality(link_ids) then raise serialization_failure; end if;
  return result;
end
$$;

create function public.reject_submission(actor uuid, selected_link uuid) returns void
language plpgsql set search_path = '' as $$
begin
  perform public.require_admin(actor,'content');
  perform 1 from public.content_submission_links where id=selected_link and submitted_at is not null for update;
  if not found then raise invalid_parameter_value; end if;
  insert into public.content_submission_decisions(link_id,actor,approved) values(selected_link,actor,false);
end
$$;

create function public.publish_submission_batch(actor uuid, items jsonb, public_assets jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare
  link public.content_submission_links;
  team public.submission_teams;
  candidate jsonb;
  payload jsonb;
  saved jsonb;
  live jsonb;
  latest jsonb;
  remaining_draft jsonb;
  result jsonb := '[]'::jsonb;
  team_id uuid;
  target integer;
  ordinal integer;
begin
  perform public.require_admin(actor,'content');
  if jsonb_array_length(items) not between 1 and 101 then raise invalid_parameter_value; end if;
  select l.team_id into team_id from public.content_submission_links l where l.id=(items->0->>'linkId')::uuid;
  if team_id is not null then
    select * into strict team from public.submission_teams t where t.id=team_id for update;
  elsif jsonb_array_length(items)<>1 then raise invalid_parameter_value; end if;
  for candidate in select i from jsonb_array_elements(items) i
    order by (i->>'kind'='project') desc,i->>'linkId'
  loop
    select * into strict link from public.content_submission_links l where l.id=(candidate->>'linkId')::uuid for update;
    if link.team_id is distinct from team_id or link.kind::text<>candidate->>'kind'
      or link.submitted_at is null or link.revoked_at is not null
      or exists (select 1 from public.content_submission_decisions d where d.link_id=link.id)
    then raise serialization_failure; end if;
    target := coalesce(link.project_id,link.review_id,link.organizer_id);
    if link.kind='project' and team.project_id is distinct from link.project_id then raise serialization_failure; end if;
    payload := candidate->'input';
    if target is not null then
      -- The normal editor locks the same parent row before making changes.
      execute format('select id from public.%I where id=$1 for update',link.kind || 's') into strict target using target;
      select p into live from public.published_content(link.kind,target) p;
      select p into latest from public.editable_content(actor,link.kind,target) p;
    else
      live := null;
      latest := null;
    end if;
    if (latest->>'revisionId')::bigint is distinct from (candidate->>'expectedRevision')::bigint
      or (latest->>'editNumber')::integer is distinct from (candidate->>'expectedEdit')::integer
      or (live->>'revisionId')::bigint is distinct from (candidate->>'expectedLive')::bigint
    then raise serialization_failure; end if;
    if link.kind in ('project','review') then
      select c.ordinal into strict ordinal from public.cohorts c where c.id=team.cohort_id;
      payload := payload || jsonb_build_object('cohort',ordinal);
    end if;
    if link.kind='review' then
      if team.project_id is null then raise invalid_parameter_value; end if;
      payload := payload || jsonb_build_object('projectId',team.project_id);
    end if;
    remaining_draft := candidate->'restoreDraft';
    saved := public.write_content(actor,link.kind,target,(latest->>'revisionId')::bigint,
      (latest->>'editNumber')::integer,'save',payload);
    target := (saved->>'id')::integer;
    perform public.write_content(actor,link.kind,target,(saved->>'revisionId')::bigint,
      (saved->>'editNumber')::integer,'publish',public_assets);
    if remaining_draft is not null and remaining_draft <> 'null'::jsonb then
      perform public.write_content(actor,link.kind,target,(saved->>'revisionId')::bigint,
        (saved->>'editNumber')::integer,'save',remaining_draft);
    end if;
    if link.kind='project' and team.project_id is null then
      update public.submission_teams t set project_id=target where t.id=team_id;
      team.project_id := target;
    end if;
    insert into public.content_submission_decisions(link_id,actor,approved,content_id)
      values(link.id,actor,true,target);
    result := result || jsonb_build_object('id',target,'kind',link.kind);
  end loop;
  return result;
end
$$;

revoke execute on function public.admin_submission_review(uuid,uuid[]), public.reject_submission(uuid,uuid),
  public.publish_submission_batch(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.admin_submission_review(uuid,uuid[]), public.reject_submission(uuid,uuid),
  public.publish_submission_batch(uuid,jsonb,jsonb) to service_role;
