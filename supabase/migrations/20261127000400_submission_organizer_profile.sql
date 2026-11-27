create table public.content_submission_organizer_profiles (
  link_id uuid primary key references public.content_submission_drafts(link_id) on delete cascade,
  mbti text not null check (char_length(mbti) <= 30)
);

create table public.content_submission_organizer_details (
  link_id uuid not null references public.content_submission_organizer_profiles(link_id) on delete cascade,
  kind text not null check (kind in ('now','previous','role','recommendation','interests')),
  ordinal integer not null check (ordinal between 1 and 100),
  body text not null check (char_length(body) <= 10000),
  primary key (link_id,kind,ordinal),
  check (kind in ('now','previous') or ordinal=1)
);

alter table public.content_submission_organizer_profiles enable row level security;
alter table public.content_submission_organizer_details enable row level security;
revoke all on public.content_submission_organizer_profiles, public.content_submission_organizer_details
  from public,anon,authenticated;

-- A link issued before this migration inherits its original published revision until it saves these fields.
create function public.submission_organizer_profile(selected_link uuid, original jsonb) returns jsonb
language sql stable set search_path = '' as $$
  with profile as (
    select mbti from public.content_submission_organizer_profiles where link_id=selected_link
  ), editable(kind, body, ordinal) as (
    select d.kind,d.body,d.ordinal::bigint from public.content_submission_organizer_details d where d.link_id=selected_link
    union all
    select v->>'kind',v->>'body',n
    from jsonb_array_elements(original->'details') with ordinality as x(v,n)
    where not exists(select 1 from profile)
  )
  select jsonb_build_object(
    'mbti', coalesce((select mbti from profile),original->>'mbti',''),
    'now', coalesce(jsonb_agg(body order by ordinal) filter(where kind='now'),'[]'),
    'previous', coalesce(jsonb_agg(body order by ordinal) filter(where kind='previous'),'[]'),
    'role', coalesce((array_agg(body order by ordinal) filter(where kind='role'))[1],''),
    'recommendation', coalesce((array_agg(body order by ordinal) filter(where kind='recommendation'))[1],''),
    'interests', coalesce((array_agg(body order by ordinal) filter(where kind='interests'))[1],'')
  ) from editable
$$;

create function public.replace_submission_organizer_profile(selected_link uuid, profile jsonb) returns void
language plpgsql set search_path = '' as $$
begin
  insert into public.content_submission_organizer_profiles(link_id,mbti)
    values(selected_link,profile->>'mbti') on conflict(link_id) do update set mbti=excluded.mbti;
  delete from public.content_submission_organizer_details where link_id=selected_link;
  insert into public.content_submission_organizer_details(link_id,kind,ordinal,body)
    select selected_link,career.kind,n,body
      from (values ('now'),('previous')) career(kind)
      cross join lateral jsonb_array_elements_text(profile->career.kind) with ordinality as x(body,n)
      where btrim(body)<>''
    union all
    select selected_link,answer.kind,1,profile->>answer.kind
      from (values ('role'),('recommendation'),('interests')) answer(kind)
      where btrim(profile->>answer.kind)<>'';
end
$$;

revoke execute on function public.submission_organizer_profile(uuid,jsonb),
  public.replace_submission_organizer_profile(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.submission_organizer_profile(uuid,jsonb),
  public.replace_submission_organizer_profile(uuid,jsonb) to service_role;

create or replace function public.submission_snapshot(selected_link uuid) returns jsonb
language sql stable set search_path = '' as $$
  select public.submission_link_data(l.id) || jsonb_build_object(
    'input', public.submission_draft_data(l.id) || jsonb_build_object(
      'cohort', c.ordinal, 'position', coalesce(l.organizer_position,m.position),
      'projectId', t.project_id
    ) || case when l.kind='organizer' then jsonb_build_object(
      'organizerProfile', public.submission_organizer_profile(l.id, original.data)
    ) else '{}'::jsonb end,
    'organizerPreview', case when l.kind='organizer' then jsonb_build_object(
      'emoji', original.data->>'emoji',
      'thumbnailId', original.data->>'thumbnailId',
      'legacyThumbnail', original.data->>'legacyThumbnail',
      'shares', coalesce((select jsonb_agg(v->>'body' order by n)
        from jsonb_array_elements(original.data->'details') with ordinality as x(v,n)
        where v->>'kind'='share'), '[]')
    ) end,
    'projectName', (select p.name from public.project_revisions p where p.parent_id=t.project_id and p.state='published')
  )
  from public.content_submission_links l
  left join public.submission_teams t on t.id=l.team_id
  left join public.cohorts c on c.id=t.cohort_id
  left join public.submission_team_members m on m.id=l.member_id
  left join lateral (select public.content_data(l.kind, l.base_revision_id) as data
    where l.kind='organizer') original on true
  where l.id=selected_link
$$;

create or replace function public.submission_replace_draft(selected_link uuid, input jsonb) returns void
language plpgsql set search_path = '' as $$
begin
  update public.content_submission_drafts set name=coalesce(input->>'name',''), title=coalesce(input->>'title',''),
    description=coalesce(input->>'description',''), thumbnail_id=(input->>'thumbnailId')::uuid,
    pdf_id=(input->>'pdfId')::uuid where link_id=selected_link;
  delete from public.content_submission_references where link_id=selected_link;
  insert into public.content_submission_references
    select selected_link,n-1,v->>'kind',v->>'url' from jsonb_array_elements(input->'links') with ordinality as x(v,n)
    where v->>'kind'<>'email' and v->>'url' ~* '^https?://';
  delete from public.content_submission_skills where link_id=selected_link;
  insert into public.content_submission_skills
    select selected_link,n-1,v from jsonb_array_elements_text(input->'skills') with ordinality as x(v,n);
  delete from public.content_submission_images where link_id=selected_link;
  insert into public.content_submission_images
    select selected_link,n-1,(v->>'mediaId')::uuid,v->>'legacyUrl'
    from jsonb_array_elements(input->'images') with ordinality as x(v,n);
  if input ? 'organizerProfile' then
    if not exists(select 1 from public.content_submission_links where id=selected_link and kind='organizer') then
      raise invalid_parameter_value;
    end if;
    perform public.replace_submission_organizer_profile(selected_link, input->'organizerProfile');
  end if;
end
$$;
