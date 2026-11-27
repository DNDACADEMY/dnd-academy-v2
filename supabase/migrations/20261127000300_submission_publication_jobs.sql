create table public.submission_publication_jobs (
  id uuid primary key default gen_random_uuid(),
  actor uuid not null references auth.users(id),
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  state text not null default 'queued' check (state in ('queued','processing','published','failed')),
  claim uuid,
  lease_until timestamptz,
  attempts smallint not null default 0 check (attempts between 0 and 3),
  created_at timestamptz not null default clock_timestamp(),
  check ((state='processing') = (claim is not null and lease_until is not null))
);
create index submission_publication_work on public.submission_publication_jobs(created_at)
  where state in ('queued','processing');

create table public.submission_publication_links (
  job_id uuid not null references public.submission_publication_jobs(id) on delete cascade,
  link_id uuid not null references public.content_submission_links(id),
  primary key (job_id,link_id)
);
create index submission_publication_link on public.submission_publication_links(link_id);

create table public.submission_publication_assets (
  job_id uuid not null references public.submission_publication_jobs(id) on delete cascade,
  source_id uuid not null references public.media_assets(id),
  public_id uuid not null references public.media_assets(id),
  primary key (job_id,source_id)
);

alter table public.submission_publication_jobs enable row level security;
alter table public.submission_publication_links enable row level security;
alter table public.submission_publication_assets enable row level security;
revoke all on public.submission_publication_jobs,public.submission_publication_links,
  public.submission_publication_assets from anon,authenticated;

create function public.queue_submission_publication(actor uuid, link_ids uuid[], fingerprint text) returns uuid
language plpgsql set search_path = '' as $$
declare job uuid;
begin
  perform public.require_admin(actor,'content');
  perform l.id from public.content_submission_links l where l.id=any(link_ids) order by l.id for update;
  perform public.admin_submission_review(actor,link_ids);
  select j.id into job from public.submission_publication_jobs j
    where j.state in ('queued','processing') and exists (
      select 1 from public.submission_publication_links l where l.job_id=j.id and l.link_id=any(link_ids))
    and j.fingerprint=queue_submission_publication.fingerprint;
  if job is not null then return job; end if;
  if exists (select 1 from public.submission_publication_links l join public.submission_publication_jobs j on j.id=l.job_id
    where l.link_id=any(link_ids) and j.state in ('queued','processing')) then raise serialization_failure; end if;
  insert into public.submission_publication_jobs(actor,fingerprint) values(actor,fingerprint) returning id into job;
  insert into public.submission_publication_links(job_id,link_id) select job,id from unnest(link_ids) id;
  return job;
end
$$;

create function public.list_submission_publications(actor uuid, link_ids uuid[]) returns jsonb
language plpgsql set search_path = '' as $$
begin
  perform public.require_admin(actor,'content');
  return coalesce((select jsonb_agg(jsonb_build_object('id',j.id,'state',j.state,'linkIds',
    (select jsonb_agg(l.link_id order by l.link_id) from public.submission_publication_links l where l.job_id=j.id))
    order by j.created_at desc)
    from public.submission_publication_jobs j where j.state <> 'published' and exists (
      select 1 from public.submission_publication_links l where l.job_id=j.id and l.link_id=any(link_ids)
    )), '[]'::jsonb);
end
$$;

create function public.claim_submission_publication(selected_job uuid, worker uuid) returns jsonb
language plpgsql set search_path = '' as $$
declare job public.submission_publication_jobs;
begin
  select j.* into job from public.submission_publication_jobs j
    where (selected_job is null or j.id=selected_job)
      and (j.state='queued' or (j.state='processing' and j.lease_until<=clock_timestamp()))
    order by j.created_at limit 1 for update skip locked;
  if not found then
    return (select jsonb_build_object('state',j.state) from public.submission_publication_jobs j where j.id=selected_job);
  end if;
  if job.attempts>=3 then
    update public.submission_publication_jobs set state='failed',claim=null,lease_until=null where id=job.id;
    return jsonb_build_object('state','failed');
  end if;
  update public.submission_publication_jobs set state='processing',claim=worker,
    lease_until=clock_timestamp()+interval '75 seconds',attempts=attempts+1 where id=job.id;
  return jsonb_build_object('id',job.id,'state','processing','actor',job.actor,'fingerprint',job.fingerprint,
    'linkIds',(select jsonb_agg(l.link_id order by l.link_id) from public.submission_publication_links l where l.job_id=job.id),
    'assets',coalesce((select jsonb_object_agg(a.source_id,a.public_id) from public.submission_publication_assets a where a.job_id=job.id),'{}'));
end
$$;

create function public.advance_submission_publication(selected_job uuid, worker uuid, source_asset uuid default null,
  public_asset uuid default null, items jsonb default null, failure boolean default false) returns jsonb
language plpgsql set search_path = '' as $$
declare
  job public.submission_publication_jobs;
  result jsonb;
begin
  select j.* into strict job from public.submission_publication_jobs j where j.id=selected_job for update;
  if job.claim is distinct from worker or job.lease_until<=clock_timestamp() then raise serialization_failure; end if;
  if failure then
    update public.submission_publication_jobs set state='failed',claim=null,lease_until=null where id=job.id;
  elsif items is not null then
    if (select array_agg((item->>'linkId')::uuid order by item->>'linkId') from jsonb_array_elements(items) item)
      is distinct from (select array_agg(l.link_id order by l.link_id) from public.submission_publication_links l where l.job_id=job.id)
      then raise invalid_parameter_value; end if;
    result := public.publish_submission_batch(job.actor,items,
      coalesce((select jsonb_object_agg(a.source_id,a.public_id) from public.submission_publication_assets a where a.job_id=job.id),'{}'));
    update public.submission_publication_jobs set state='published',claim=null,lease_until=null where id=job.id;
  else
    insert into public.submission_publication_assets(job_id,source_id,public_id) values(job.id,source_asset,public_asset);
    update public.submission_publication_jobs set state='queued',claim=null,lease_until=null,attempts=0 where id=job.id;
  end if;
  return result;
end
$$;

revoke execute on function public.queue_submission_publication(uuid,uuid[],text),
  public.list_submission_publications(uuid,uuid[]),public.claim_submission_publication(uuid,uuid),
  public.advance_submission_publication(uuid,uuid,uuid,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.queue_submission_publication(uuid,uuid[],text),
  public.list_submission_publications(uuid,uuid[]),public.claim_submission_publication(uuid,uuid),
  public.advance_submission_publication(uuid,uuid,uuid,uuid,jsonb,boolean) to service_role;
