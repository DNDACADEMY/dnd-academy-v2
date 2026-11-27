alter table public.organizers add column deleted_at timestamptz;

create function public.soft_delete_organizer(actor uuid, selected_id integer, expected_revision bigint, expected_edit integer)
returns jsonb language plpgsql set search_path = '' as $$
declare
  revision bigint;
  edit integer;
begin
  perform public.require_admin(actor, 'content');

  -- All editor and issuance writes lock the same organizer row.
  perform 1 from public.organizers where id=selected_id and deleted_at is null for update;
  if not found then raise serialization_failure; end if;

  select id, edit_number into revision, edit from public.organizer_revisions
  where parent_id=selected_id order by state, version desc limit 1;
  if revision is null or revision is distinct from expected_revision or edit is distinct from expected_edit
  then raise serialization_failure; end if;

  -- Preserve both revision contents and drafts. Normal publication readers already exclude archived revisions.
  update public.organizer_revisions set state='archived'
  where parent_id=selected_id and state='published';
  update public.organizers set deleted_at=clock_timestamp() where id=selected_id;
  insert into public.admin_audit (actor,operation,target) values (actor,'organizer.delete','organizer/' || selected_id);
  return jsonb_build_object('id',selected_id);
end
$$;

create function public.require_undeleted_organizer_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform 1 from public.organizers where id=new.parent_id and deleted_at is null for update;
  if not found then raise serialization_failure; end if;
  return new;
end
$$;

create trigger require_undeleted_organizer_revision
before insert or update of state on public.organizer_revisions
for each row execute function public.require_undeleted_organizer_revision();

create or replace function public.editable_content(actor uuid, kind public.content_kind, selected_id integer default null)
returns setof jsonb language plpgsql set search_path = '' as $$
begin
  perform public.require_admin(actor, 'content');
  return query execute format('select public.content_data($1,id) || jsonb_build_object(''state'', state,
      ''liveRevisionId'', (select p.id from public.%I p where p.parent_id = revisions.parent_id and p.state = ''published''),
      ''liveEditNumber'', (select p.edit_number from public.%I p where p.parent_id = revisions.parent_id and p.state = ''published''))
    from (select distinct on (parent_id) id,state,parent_id from public.%I r
     where ($2 is null or parent_id = $2) %s
     order by parent_id, state, version desc) revisions order by parent_id', kind || '_revisions', kind || '_revisions', kind || '_revisions',
      case when kind = 'organizer' then
        'and exists (select 1 from public.organizers o where o.id = r.parent_id and o.deleted_at is null)'
        else '' end) using kind, selected_id;
end $$;

create or replace function public.content_workspace(actor uuid, kind public.content_kind, selected_id integer default null)
returns jsonb language plpgsql set search_path = '' as $$
declare
  revision_table text := kind || '_revisions';
  author_column text := case when kind = 'organizer' then 'r.author' else 'null::text' end;
  position_column text := case when kind <> 'project' then 'r.position' else 'null::text' end;
  cohort_column text := case when kind = 'organizer' then 'null::integer' else 'c.ordinal' end;
  activity_column text := case when kind = 'organizer' then 'coalesce(p.is_archived, r.is_archived)' else 'null::boolean' end;
  organizer_join text := case when kind = 'organizer' then
    'join public.organizers o on o.id = r.parent_id and o.deleted_at is null' else '' end;
  cohort_join text := case when kind = 'organizer' then '' else 'left join public.cohorts c on c.id = r.cohort_id' end;
  summaries jsonb;
  selected jsonb;
begin
  perform public.require_admin(actor, 'content');
  execute format($query$
    select coalesce(jsonb_agg(to_jsonb(summary) order by summary.id), '[]')
    from (
      select distinct on (r.parent_id) r.parent_id as id, r.name, r.state,
        p.id as "liveRevisionId", %s as author, %s as position, %s as cohort, %s as "isArchived"
      from public.%I r
      left join public.%I p on p.parent_id = r.parent_id and p.state = 'published'
      %s
      %s
      order by r.parent_id, r.state, r.version desc
    ) summary
  $query$, author_column, position_column, cohort_column, activity_column, revision_table, revision_table, organizer_join, cohort_join)
  into summaries;

  if selected_id is not null then
    select item into selected from public.editable_content(actor, kind, selected_id) item;
  end if;

  return jsonb_build_object('rows', summaries, 'initial', selected);
end $$;

create or replace function public.submission_link_data(selected_link uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', l.id, 'kind', l.kind, 'label', l.label, 'teamId', l.team_id,
    'memberId', l.member_id, 'targetId', coalesce(l.project_id,l.review_id,l.organizer_id),
    'expiresAt', l.expires_at, 'version', d.version, 'savedAt', d.saved_at,
    'state', case when decision.approved then 'published' when decision.approved = false then 'rejected'
      when l.revoked_at is not null or o.deleted_at is not null then 'revoked'
      when l.submitted_at is not null then 'submitted'
      when l.expires_at <= statement_timestamp() then 'expired'
      when d.version > 0 then 'editing' else 'issued' end,
    'cohort', c.ordinal, 'teamNumber', t.number, 'publishedId', decision.content_id
  )
  from public.content_submission_links l
  join public.content_submission_drafts d on d.link_id = l.id
  left join public.organizers o on o.id = l.organizer_id
  left join public.submission_teams t on t.id = l.team_id
  left join public.cohorts c on c.id = t.cohort_id
  left join public.content_submission_decisions decision on decision.link_id = l.id
  where l.id = selected_link
$$;

create or replace function public.submission_require_link(selected_link uuid, credential text) returns public.content_submission_links
language plpgsql set search_path = '' as $$
declare link public.content_submission_links;
begin
  select * into link from public.content_submission_links
    where id=selected_link and token_hash=credential for share;
  if not found then raise no_data_found; end if;
  if link.revoked_at is not null or link.submitted_at is not null
    or link.expires_at <= clock_timestamp() then raise insufficient_privilege; end if;
  if link.organizer_id is not null then
    perform 1 from public.organizers where id=link.organizer_id and deleted_at is null for share;
    if not found then raise insufficient_privilege; end if;
  end if;
  return link;
end
$$;

revoke execute on function public.soft_delete_organizer(uuid,integer,bigint,integer),
  public.require_undeleted_organizer_revision() from public, anon, authenticated;
grant execute on function public.soft_delete_organizer(uuid,integer,bigint,integer) to service_role;
