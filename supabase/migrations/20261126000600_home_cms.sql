create table public.home_revisions (
  id bigint generated always as identity primary key,
  editor uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  cumulative_applicants integer not null check (cumulative_applicants >= 0),
  total_participants integer not null check (total_participants >= 0),
  total_projects integer not null check (total_projects >= 0),
  dropouts integer not null check (dropouts >= 0),
  dropout_cohort integer not null check (dropout_cohort between 1 and 10000),
  as_of date,
  sponsor_description text not null check (char_length(sponsor_description) between 1 and 2000),
  sponsor_contact_url text check (sponsor_contact_url ~ '^https?://[^[:space:]]+$' and length(sponsor_contact_url) <= 2048),
  automatic_projects boolean not null
);

create table public.home_state (
  singleton boolean primary key default true check (singleton),
  draft_id bigint not null references public.home_revisions,
  published_id bigint not null references public.home_revisions
);

create table public.home_faqs (
  revision_id bigint not null references public.home_revisions on delete cascade,
  ordinal integer not null check (ordinal between 1 and 100),
  question text not null check (char_length(btrim(question)) between 1 and 300),
  answer text not null check (char_length(btrim(answer)) between 1 and 8000),
  visible boolean not null,
  primary key (revision_id, ordinal)
);

create table public.home_sponsors (
  revision_id bigint not null references public.home_revisions on delete cascade,
  ordinal integer not null check (ordinal between 1 and 100),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  url text check (url ~ '^https?://[^[:space:]]+$' and length(url) <= 2048),
  logo_path text check (logo_path ~ '^/assets/logos/sponsors/[a-z0-9-]+[.]png$'),
  media_id uuid references public.media_assets,
  visible boolean not null,
  check (num_nonnulls(logo_path, media_id) = 1),
  primary key (revision_id, ordinal)
);

create table public.home_featured_projects (
  revision_id bigint not null references public.home_revisions on delete cascade,
  ordinal integer not null check (ordinal between 1 and 20),
  project_id integer not null references public.projects,
  primary key (revision_id, ordinal),
  unique (revision_id, project_id)
);

alter table public.home_revisions enable row level security;
alter table public.home_state enable row level security;
alter table public.home_faqs enable row level security;
alter table public.home_sponsors enable row level security;
alter table public.home_featured_projects enable row level security;
revoke all on public.home_revisions, public.home_state, public.home_faqs, public.home_sponsors,
  public.home_featured_projects from anon, authenticated;

create function public.home_revision_data(revision bigint) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'stats', jsonb_build_object('cumulativeApplicants', r.cumulative_applicants, 'totalParticipants', r.total_participants,
      'totalProjects', r.total_projects, 'dropouts', r.dropouts, 'dropoutCohort', r.dropout_cohort, 'asOf', r.as_of),
    'sponsorInfo', jsonb_build_object('description', r.sponsor_description, 'contactUrl', r.sponsor_contact_url),
    'automaticProjects', r.automatic_projects,
    'faqs', coalesce((select jsonb_agg(jsonb_build_object('question', q.question, 'answer', q.answer, 'visible', q.visible)
      order by q.ordinal) from public.home_faqs q where q.revision_id = r.id), '[]'),
    'sponsors', coalesce((select jsonb_agg(jsonb_build_object('name', s.name, 'url', s.url,
      'logoPath', s.logo_path, 'mediaId', s.media_id, 'visible', s.visible) order by s.ordinal)
      from public.home_sponsors s where s.revision_id = r.id), '[]'),
    'projectIds', coalesce((select jsonb_agg(p.project_id order by p.ordinal)
      from public.home_featured_projects p where p.revision_id = r.id), '[]')
  )
  from public.home_revisions r where r.id = revision
$$;

create function public.insert_home_revision(data jsonb, actor uuid) returns bigint
language plpgsql set search_path = '' as $$
declare
  revision bigint;
begin
  insert into public.home_revisions(editor, cumulative_applicants, total_participants, total_projects,
    dropouts, dropout_cohort, as_of, sponsor_description, sponsor_contact_url, automatic_projects)
  values (actor, (data #>> '{stats,cumulativeApplicants}')::integer, (data #>> '{stats,totalParticipants}')::integer,
    (data #>> '{stats,totalProjects}')::integer, (data #>> '{stats,dropouts}')::integer,
    (data #>> '{stats,dropoutCohort}')::integer, (data #>> '{stats,asOf}')::date,
    data #>> '{sponsorInfo,description}', data #>> '{sponsorInfo,contactUrl}', (data ->> 'automaticProjects')::boolean)
  returning id into revision;

  insert into public.home_faqs
  select revision, ordinal, entry->>'question', entry->>'answer', (entry->>'visible')::boolean
  from jsonb_array_elements(data->'faqs') with ordinality as item(entry, ordinal);

  insert into public.home_sponsors
  select revision, ordinal, entry->>'name', entry->>'url', entry->>'logoPath',
    (entry->>'mediaId')::uuid, (entry->>'visible')::boolean
  from jsonb_array_elements(data->'sponsors') with ordinality as item(entry, ordinal);

  insert into public.home_featured_projects
  select revision, ordinal, entry::integer
  from jsonb_array_elements_text(data->'projectIds') with ordinality as item(entry, ordinal);

  return revision;
end $$;

create function public.seed_home_cms(data jsonb) returns void
language plpgsql set search_path = '' as $$
declare
  revision bigint;
begin
  lock table public.home_state in share row exclusive mode;
  if exists (select 1 from public.home_state) then return; end if;
  revision := public.insert_home_revision(data, null);
  insert into public.home_state(draft_id, published_id) values (revision, revision);
end $$;

create function public.published_home() returns jsonb
language sql stable set search_path = '' as $$
  select public.home_revision_data(published_id) from public.home_state
$$;

create function public.editable_home(actor uuid) returns jsonb
language plpgsql set search_path = '' as $$
begin
  perform public.require_admin(actor, 'content');
  return (select jsonb_build_object('revisionId', draft_id, 'publishedId', published_id,
    'input', public.home_revision_data(draft_id)) from public.home_state);
end $$;

create function public.write_home(actor uuid, expected_revision bigint, operation text, input jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare
  active public.home_state;
  revision bigint;
begin
  perform public.require_admin(actor, 'content');
  select * into strict active from public.home_state where singleton for update;
  if active.draft_id <> expected_revision then raise serialization_failure; end if;
  if operation not in ('save', 'publish') then raise invalid_parameter_value; end if;
  revision := public.insert_home_revision(input, actor);
  if operation = 'publish' then
    if exists (
      select 1 from public.home_sponsors s join public.media_assets m on m.id = s.media_id
      where s.revision_id = revision and (m.bucket <> 'cms-public' or not m.ready or m.mime <> 'image/webp')
    ) then raise check_violation; end if;
    update public.home_state set draft_id = revision, published_id = revision where singleton;
  else
    update public.home_state set draft_id = revision where singleton;
  end if;
  return jsonb_build_object('revisionId', revision,
    'publishedId', case when operation = 'publish' then revision else active.published_id end,
    'input', public.home_revision_data(revision));
end $$;

revoke execute on function public.home_revision_data(bigint), public.insert_home_revision(jsonb,uuid),
  public.seed_home_cms(jsonb), public.published_home(), public.editable_home(uuid),
  public.write_home(uuid,bigint,text,jsonb) from public, anon, authenticated;
grant execute on function public.published_home(), public.editable_home(uuid),
  public.write_home(uuid,bigint,text,jsonb) to service_role;
-- The RPCs run as service_role and call the internal functions with the same role.
grant execute on function public.home_revision_data(bigint), public.insert_home_revision(jsonb,uuid) to service_role;
