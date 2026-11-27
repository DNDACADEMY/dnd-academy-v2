create function public.read_submission_publication(actor uuid, selected_job uuid) returns jsonb
language plpgsql set search_path = '' as $$
begin
  perform public.require_admin(actor,'content');
  return (
    select jsonb_build_object('state',j.state,'published',coalesce((
      select jsonb_agg(jsonb_build_object('id',d.content_id,'kind',l.kind) order by l.kind,l.id)
      from public.submission_publication_links p
      join public.content_submission_links l on l.id=p.link_id
      join public.content_submission_decisions d on d.link_id=l.id and d.approved
      where p.job_id=j.id and j.state='published'
    ),'[]'::jsonb))
    from public.submission_publication_jobs j where j.id=selected_job
  );
end
$$;

-- A known transient failure can give up its claim early. A crashed worker
-- leaves its claim to expire. Neither path resets the step's attempt budget.
create function public.release_submission_publication(selected_job uuid, worker uuid) returns void
language sql set search_path = '' as $$
  update public.submission_publication_jobs
    set state=case when attempts>=3 then 'failed' else 'queued' end,claim=null,lease_until=null
  where id=selected_job and claim=worker and state='processing' and lease_until>clock_timestamp()
$$;

revoke execute on function public.read_submission_publication(uuid,uuid),
  public.release_submission_publication(uuid,uuid) from public,anon,authenticated;
grant execute on function public.read_submission_publication(uuid,uuid),
  public.release_submission_publication(uuid,uuid) to service_role;
