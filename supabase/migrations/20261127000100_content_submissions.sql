create table public.submission_teams (
  id uuid primary key default gen_random_uuid(),
  cohort_id bigint not null references public.cohorts,
  number integer not null check (number > 0),
  project_id integer unique references public.projects,
  unique (cohort_id, number)
);

create table public.submission_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.submission_teams,
  name text not null check (length(btrim(name)) between 1 and 160),
  position text not null check (position in (
    '백엔드 개발자', '프론트엔드 개발자', '프로덕트 디자이너', 'Android Developer', 'iOS Developer'
  )),
  unique (team_id, id)
);

create table public.content_submission_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  issued_by uuid references auth.users on delete set null,
  kind public.content_kind not null,
  team_id uuid references public.submission_teams,
  member_id uuid,
  project_id integer references public.projects,
  review_id integer references public.reviews,
  organizer_id integer references public.organizers,
  organizer_position text check (organizer_position in ('개발', '디자인', '마케팅', '운영', '마스코트')),
  organizer_archived boolean,
  label text not null check (length(btrim(label)) between 1 and 160),
  base_revision_id bigint,
  created_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  submitted_at timestamptz,
  foreign key (team_id, member_id) references public.submission_team_members (team_id, id),
  check (
    (kind = 'project' and team_id is not null and member_id is null and review_id is null and organizer_id is null
      and organizer_position is null and organizer_archived is null)
    or (kind = 'review' and team_id is not null and member_id is not null and project_id is null and organizer_id is null
      and organizer_position is null and organizer_archived is null)
    or (kind = 'organizer' and team_id is null and member_id is null and project_id is null and review_id is null
      and organizer_position is not null and organizer_archived is not null)
  )
);

create unique index submission_project_link on public.content_submission_links (team_id)
  where kind = 'project' and revoked_at is null and submitted_at is null;
create unique index submission_review_link on public.content_submission_links (member_id)
  where kind = 'review' and revoked_at is null and submitted_at is null;
create unique index submission_organizer_link on public.content_submission_links (organizer_id)
  where kind = 'organizer' and revoked_at is null and submitted_at is null;

create table public.content_submission_drafts (
  link_id uuid primary key references public.content_submission_links,
  version integer not null default 0 check (version >= 0),
  name text not null default '' check (length(name) <= 160),
  title text not null default '' check (length(title) <= 300),
  description text not null default '' check (length(description) <= 50000),
  thumbnail_id uuid references public.media_assets,
  pdf_id uuid references public.media_assets,
  saved_at timestamptz
);

create table public.content_submission_references (
  link_id uuid not null references public.content_submission_drafts,
  ordinal integer not null check (ordinal >= 0),
  kind text not null check (length(kind) between 1 and 30 and kind <> 'email'),
  url text not null check (length(url) <= 2048 and url ~* '^https?://'),
  primary key (link_id, ordinal)
);

create table public.content_submission_skills (
  link_id uuid not null references public.content_submission_drafts,
  ordinal integer not null check (ordinal >= 0),
  label text not null check (length(btrim(label)) between 1 and 160),
  primary key (link_id, ordinal)
);

create table public.content_submission_images (
  link_id uuid not null references public.content_submission_drafts,
  ordinal integer not null check (ordinal >= 0),
  media_id uuid references public.media_assets,
  legacy_url text,
  primary key (link_id, ordinal),
  check (media_id is not null or legacy_url is not null)
);

create table public.content_submission_decisions (
  link_id uuid primary key references public.content_submission_links,
  actor uuid references auth.users on delete set null,
  approved boolean not null,
  decided_at timestamptz not null default statement_timestamp(),
  content_id integer check (content_id >= 0),
  check (approved = (content_id is not null))
);

alter table public.cms_uploads alter column actor drop not null;
alter table public.cms_uploads add column submission_link_id uuid references public.content_submission_links;
alter table public.cms_uploads add column verified_asset_id uuid references public.media_assets;
alter table public.cms_uploads add constraint cms_upload_has_one_owner
  check (num_nonnulls(actor, submission_link_id) = 1);
create index cms_upload_submission_asset on public.cms_uploads (submission_link_id, verified_asset_id)
  where submission_link_id is not null;

create function public.submission_draft_data(selected_link uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'name', d.name, 'title', d.title, 'description', d.description,
    'thumbnailId', d.thumbnail_id, 'pdfId', d.pdf_id,
    'links', coalesce((select jsonb_agg(jsonb_build_object('kind',r.kind,'url',r.url) order by r.ordinal)
      from public.content_submission_references r where r.link_id = d.link_id), '[]'),
    'skills', coalesce((select jsonb_agg(s.label order by s.ordinal)
      from public.content_submission_skills s where s.link_id = d.link_id), '[]'),
    'images', coalesce((select jsonb_agg(jsonb_build_object('mediaId',i.media_id,'legacyUrl',i.legacy_url) order by i.ordinal)
      from public.content_submission_images i where i.link_id = d.link_id), '[]')
  ) from public.content_submission_drafts d where d.link_id = selected_link
$$;

create function public.submission_link_data(selected_link uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', l.id, 'kind', l.kind, 'label', l.label, 'teamId', l.team_id,
    'memberId', l.member_id, 'targetId', coalesce(l.project_id,l.review_id,l.organizer_id),
    'expiresAt', l.expires_at, 'version', d.version, 'savedAt', d.saved_at,
    'state', case when decision.approved then 'published' when decision.approved = false then 'rejected'
      when l.revoked_at is not null then 'revoked'
      when l.submitted_at is not null then 'submitted'
      when l.expires_at <= statement_timestamp() then 'expired'
      when d.version > 0 then 'editing' else 'issued' end,
    'cohort', c.ordinal, 'teamNumber', t.number, 'publishedId', decision.content_id
  )
  from public.content_submission_links l
  join public.content_submission_drafts d on d.link_id = l.id
  left join public.submission_teams t on t.id = l.team_id
  left join public.cohorts c on c.id = t.cohort_id
  left join public.content_submission_decisions decision on decision.link_id = l.id
  where l.id = selected_link
$$;

create function public.submission_snapshot(selected_link uuid) returns jsonb
language sql stable set search_path = '' as $$
  select public.submission_link_data(l.id) || jsonb_build_object(
    'input', public.submission_draft_data(l.id) || jsonb_build_object(
      'cohort', c.ordinal, 'position', coalesce(l.organizer_position,m.position),
      'projectId', t.project_id
    ),
    'projectName', (select p.name from public.project_revisions p where p.parent_id=t.project_id and p.state='published')
  )
  from public.content_submission_links l
  left join public.submission_teams t on t.id=l.team_id
  left join public.cohorts c on c.id=t.cohort_id
  left join public.submission_team_members m on m.id=l.member_id
  where l.id=selected_link
$$;

create function public.submission_require_link(selected_link uuid, credential text) returns public.content_submission_links
language plpgsql set search_path = '' as $$
declare link public.content_submission_links;
begin
  select * into link from public.content_submission_links
    where id=selected_link and token_hash=credential for share;
  if not found then raise no_data_found; end if;
  if link.revoked_at is not null or link.submitted_at is not null
    or link.expires_at <= clock_timestamp() then raise insufficient_privilege; end if;
  return link;
end
$$;

create function public.submission_media_access(selected_link uuid, credential text, asset uuid) returns void
language plpgsql set search_path = '' as $$
declare
  link public.content_submission_links;
  inherited jsonb;
begin
  link := public.submission_require_link(selected_link,credential);
  if link.kind='review' then raise insufficient_privilege; end if;
  inherited := public.content_data(link.kind,link.base_revision_id);
  if not exists (
    select 1 from public.media_assets a where a.id=asset and a.ready and not a.publication_pending
    and (exists(select 1 from public.cms_uploads u where u.submission_link_id=selected_link and u.verified_asset_id=a.id)
      or a.id::text in (inherited->>'thumbnailId',inherited->>'pdfId')
      or exists(select 1 from jsonb_array_elements(inherited->'images') i where i->>'mediaId'=a.id::text))
  ) then raise insufficient_privilege; end if;
end
$$;

create function public.read_submission(selected_link uuid, credential text) returns jsonb
language plpgsql set search_path = '' as $$
begin
  perform public.submission_require_link(selected_link, credential);
  return public.submission_snapshot(selected_link);
end
$$;

create function public.submission_replace_draft(selected_link uuid, input jsonb) returns void
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
end
$$;

create function public.save_submission(selected_link uuid, credential text, expected_version integer,
  input jsonb, submit boolean) returns jsonb
language plpgsql set search_path = '' as $$
declare
  link public.content_submission_links;
  draft public.content_submission_drafts;
  media jsonb;
  inherited jsonb;
begin
  -- Serialize renewal, revocation, and concurrent writes against the same link.
  perform 1 from public.content_submission_links where id=selected_link and token_hash=credential for update;
  link := public.submission_require_link(selected_link, credential);
  select * into strict draft from public.content_submission_drafts where link_id=selected_link;
  if draft.version <> expected_version then raise serialization_failure; end if;
  if submit and (length(btrim(coalesce(input->>'name','')))=0
    or (link.kind='project' and length(btrim(coalesce(input->>'title','')))=0)
    or (link.kind='review' and length(btrim(coalesce(input->>'description','')))=0)) then
    raise invalid_parameter_value;
  end if;
  if link.kind='review' and input ?| array['thumbnailId','pdfId','images','skills','title']
    or link.kind='organizer' and input ?| array['pdfId','images','title'] then raise invalid_parameter_value; end if;
  inherited := coalesce(public.content_data(link.kind,link.base_revision_id),'{}');
  for media in
    select value from jsonb_array_elements(jsonb_build_array(
      jsonb_build_object('mediaId',input->>'thumbnailId','mime','image/webp'),
      jsonb_build_object('mediaId',input->>'pdfId','mime','application/pdf')
    ))
    union all select v || '{"mime":"image/webp"}' from jsonb_array_elements(input->'images') as v
  loop
    if media->>'mediaId' is null then
      if media->>'legacyUrl' is not null and not exists (
        select 1 from jsonb_array_elements(inherited->'images') i where i->>'legacyUrl'=media->>'legacyUrl'
      ) then raise invalid_parameter_value; end if;
      continue;
    end if;
    if not exists (
      select 1 from public.media_assets a where a.id=(media->>'mediaId')::uuid
        and a.ready and not a.publication_pending and a.mime=media->>'mime'
        and (exists (select 1 from public.cms_uploads u where u.submission_link_id=selected_link and u.verified_asset_id=a.id)
          or a.id::text in (inherited->>'thumbnailId', inherited->>'pdfId')
          or exists (select 1 from jsonb_array_elements(inherited->'images') i where i->>'mediaId'=a.id::text))
    ) then raise invalid_parameter_value; end if;
  end loop;
  perform public.submission_replace_draft(selected_link,input);
  update public.content_submission_drafts set version=version+1,saved_at=statement_timestamp() where link_id=selected_link;
  if submit then
    update public.content_submission_links set submitted_at=statement_timestamp() where id=selected_link;
  end if;
  return public.submission_snapshot(selected_link);
end
$$;

create function public.admin_submission_action(actor uuid, operation text, input jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare
  team public.submission_teams;
  member public.submission_team_members;
  base jsonb;
  target integer;
  selected_link uuid;
  selected_kind public.content_kind;
  new_deadline timestamptz;
  changed integer;
  cohort bigint;
begin
  perform public.require_admin(actor, 'content');
  if operation='teams' then
    cohort := (input->>'cohortId')::bigint;
    insert into public.submission_teams (cohort_id,number)
      select cohort,n from generate_series(1,(input->>'count')::integer) as n on conflict do nothing;
    get diagnostics changed=row_count;
  elsif operation='member' then
    insert into public.submission_team_members (team_id,name,position)
      values ((input->>'teamId')::uuid,input->>'name',input->>'position');
    changed := 1;
  elsif operation='revoke' then
    update public.content_submission_links set revoked_at=statement_timestamp()
      where id=(input->>'linkId')::uuid and revoked_at is null and submitted_at is null;
    get diagnostics changed=row_count;
  elsif operation='extend' then
    new_deadline := (input->>'expiresAt')::timestamptz;
    if new_deadline<=statement_timestamp() then raise invalid_parameter_value; end if;
    update public.content_submission_links l set expires_at=new_deadline
      where revoked_at is null and submitted_at is null and expires_at<new_deadline
      and case input->>'scope'
        when 'link' then l.id=(input->>'id')::uuid
        when 'team' then l.team_id=(input->>'id')::uuid
        when 'cohort' then exists (select 1 from public.submission_teams t where t.id=l.team_id and t.cohort_id=(input->>'id')::bigint)
        else false end;
    get diagnostics changed=row_count;
  elsif operation='issue' then
    selected_kind := (input->>'kind')::public.content_kind;
    target := (input->>'targetId')::integer;
    new_deadline := (input->>'expiresAt')::timestamptz;
    if new_deadline<=statement_timestamp() then raise invalid_parameter_value; end if;
    if selected_kind<>'organizer' then
      select * into strict team from public.submission_teams where id=(input->>'teamId')::uuid for update;
    end if;
    if selected_kind='project' then
      if target is null then target := team.project_id; end if;
      if team.project_id is not null and team.project_id is distinct from target then raise invalid_parameter_value; end if;
    elsif selected_kind='review' then
      select * into strict member from public.submission_team_members where id=(input->>'memberId')::uuid and team_id=team.id;
    end if;
    if target is not null then
      execute format('select id from public.%I where id=$1 for update', selected_kind || 's') into strict target using target;
      select p into strict base from public.published_content(selected_kind,target) p;
      if selected_kind='project' and not exists (
        select 1 from public.cohorts c where c.id=team.cohort_id and c.ordinal=(base->>'cohort')::integer
      ) then raise invalid_parameter_value; end if;
      if selected_kind='review' and (team.project_id is null or (base->>'projectId')::integer is distinct from team.project_id)
      then raise invalid_parameter_value; end if;
    end if;
    if selected_kind='project' and target is not null and team.project_id is null then
      update public.submission_teams set project_id=target where id=team.id;
    end if;
    if exists (
      select 1 from public.content_submission_links l
      where l.kind=selected_kind and l.submitted_at is not null
        and not exists (select 1 from public.content_submission_decisions d where d.link_id=l.id)
        and case selected_kind
          when 'project' then l.team_id=team.id
          when 'review' then l.member_id=member.id or l.review_id=target
          when 'organizer' then l.organizer_id=target
        end
    ) then raise unique_violation; end if;
    insert into public.content_submission_links (token_hash,issued_by,kind,team_id,member_id,project_id,review_id,
      organizer_id,organizer_position,organizer_archived,label,base_revision_id,expires_at)
    values (input->>'tokenHash',actor,selected_kind,team.id,member.id,
      case when selected_kind='project' then target end,case when selected_kind='review' then target end,
      case when selected_kind='organizer' then target end,
      case when selected_kind='organizer' then coalesce(base->>'position',input->>'position') end,
      case when selected_kind='organizer' then coalesce((base->>'isArchived')::boolean,(input->>'archived')::boolean) end,
      coalesce(base->>'name',member.name,input->>'label'),(base->>'revisionId')::bigint,new_deadline)
    returning id into selected_link;
    insert into public.content_submission_drafts (link_id) values (selected_link);
    if base is not null then perform public.submission_replace_draft(selected_link,base); end if;
    return public.submission_link_data(selected_link);
  else
    raise invalid_parameter_value;
  end if;
  return jsonb_build_object('changed',changed);
end
$$;

create function public.admin_submission_workspace(actor uuid, cohort_number integer default null) returns jsonb
language plpgsql set search_path = '' as $$
declare cohort bigint;
begin
  perform public.require_admin(actor, 'content');
  select c.id into cohort from public.cohorts c
    where cohort_number is null or c.ordinal=cohort_number order by c.ordinal desc limit 1;
  return jsonb_build_object(
    'cohortId',cohort,
    'cohorts',coalesce((select jsonb_agg(jsonb_build_object('id',id,'ordinal',ordinal) order by ordinal desc) from public.cohorts),'[]'),
    'teams',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'number',t.number,'projectId',t.project_id,
      'members',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'name',m.name,'position',m.position) order by m.name,m.id)
        from public.submission_team_members m where m.team_id=t.id),'[]')) order by t.number)
      from public.submission_teams t where t.cohort_id=cohort),'[]'),
    'links',coalesce((select jsonb_agg(public.submission_link_data(x.id) order by x.created_at desc)
      from (select l.id,l.created_at from public.content_submission_links l
        left join public.submission_teams t on t.id=l.team_id
        where t.cohort_id=cohort or l.kind='organizer') x),'[]')
  );
end
$$;

do $$
declare item regclass;
begin
  foreach item in array array['public.submission_teams','public.submission_team_members','public.content_submission_links',
    'public.content_submission_drafts','public.content_submission_references','public.content_submission_skills',
    'public.content_submission_images','public.content_submission_decisions']::regclass[]
  loop
    execute format('alter table %s enable row level security',item);
    execute format('revoke all on %s from public,anon,authenticated',item);
  end loop;
end
$$;

revoke execute on function public.submission_draft_data(uuid), public.submission_link_data(uuid), public.submission_snapshot(uuid),
  public.submission_require_link(uuid,text), public.submission_replace_draft(uuid,jsonb), public.read_submission(uuid,text),
  public.save_submission(uuid,text,integer,jsonb,boolean), public.admin_submission_action(uuid,text,jsonb),
  public.admin_submission_workspace(uuid,integer) from public,anon,authenticated;
grant execute on function public.read_submission(uuid,text), public.save_submission(uuid,text,integer,jsonb,boolean),
  public.admin_submission_action(uuid,text,jsonb), public.admin_submission_workspace(uuid,integer),
  public.submission_require_link(uuid,text) to service_role;
revoke execute on function public.submission_media_access(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.submission_media_access(uuid,text,uuid) to service_role;
