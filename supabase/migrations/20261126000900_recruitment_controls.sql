create table public.recruitment_controls (
  singleton boolean primary key default true check (singleton),
  version integer not null default 1 check (version > 0),
  cohort_id bigint not null references public.cohorts,
  application_mode text not null check (application_mode in ('auto', 'open', 'notify', 'hidden')),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  developer_url text check (length(developer_url) <= 2048 and developer_url ~ '^https://[^[:space:]]+$'),
  designer_url text check (length(designer_url) <= 2048 and designer_url ~ '^https://[^[:space:]]+$'),
  notification_url text not null check (length(notification_url) <= 2048 and notification_url ~ '^https://[^[:space:]]+$'),
  passboard_mode text not null check (passboard_mode in ('auto', 'visible', 'hidden')),
  check (application_mode not in ('auto', 'open') or num_nonnulls(developer_url, designer_url) > 0)
);

alter table public.recruitment_controls enable row level security;
revoke all on public.recruitment_controls from anon, authenticated;
grant select, insert, update on public.recruitment_controls to service_role;

insert into public.recruitment_controls(cohort_id, application_mode, starts_at, ends_at,
  developer_url, designer_url, notification_url, passboard_mode)
select id, 'auto', '2026-11-16 00:00:00+09', '2026-12-07 00:00:00+09',
  'https://forms.gle/bGLzZbQARiUvQwxWA', 'https://forms.gle/fmGigShJQeNaz64D9',
  'https://forms.gle/nA3MLWbUyAoikWw16', 'auto'
from public.cohorts where ordinal=16;

create function public.recruitment_controls_data() returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('version', r.version, 'cohortId', c.id, 'cohort', c.ordinal,
    'applicationMode', r.application_mode, 'startsAt', r.starts_at, 'endsAt', r.ends_at,
    'developerUrl', r.developer_url, 'designerUrl', r.designer_url, 'notificationUrl', r.notification_url,
    'passboardMode', r.passboard_mode,
    'announcement', case when e.id is not null
      then jsonb_build_object('startsAt', e.starts_at, 'endsAt', e.ends_at, 'ready', e.ready) end)
  from public.recruitment_controls r join public.cohorts c on c.id = r.cohort_id
  left join public.admission_events e on e.cohort_id = c.id and e.is_current
  where r.singleton
$$;

create function public.write_recruitment_controls(actor uuid, expected_version integer, input jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare current_version integer;
begin
  perform public.require_admin(actor, 'admissions');
  select version into current_version from public.recruitment_controls where singleton for update;
  if current_version is distinct from expected_version then raise serialization_failure; end if;

  insert into public.recruitment_controls as r(cohort_id, application_mode, starts_at, ends_at,
    developer_url, designer_url, notification_url, passboard_mode)
  values ((input->>'cohortId')::bigint, input->>'applicationMode', (input->>'startsAt')::timestamptz,
    (input->>'endsAt')::timestamptz, input->>'developerUrl', input->>'designerUrl',
    input->>'notificationUrl', input->>'passboardMode')
  on conflict (singleton) do update set version = r.version+1, cohort_id=excluded.cohort_id,
    application_mode=excluded.application_mode, starts_at=excluded.starts_at, ends_at=excluded.ends_at,
    developer_url=excluded.developer_url, designer_url=excluded.designer_url,
    notification_url=excluded.notification_url, passboard_mode=excluded.passboard_mode
  where r.version = expected_version;
  if not found then raise serialization_failure; end if;

  insert into public.admin_audit(actor,operation,target)
    values(actor,'recruitment.controls','cohort/' || (input->>'cohortId'));
  return public.recruitment_controls_data();
end $$;

revoke execute on function public.recruitment_controls_data(), public.write_recruitment_controls(uuid,integer,jsonb)
  from public, anon, authenticated;
grant execute on function public.recruitment_controls_data(), public.write_recruitment_controls(uuid,integer,jsonb)
  to service_role;
