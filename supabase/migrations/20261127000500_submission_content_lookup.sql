create function public.lookup_submission_content(
  actor uuid, kind public.content_kind, search_term text, cohort_number integer default null
) returns jsonb
language plpgsql set search_path = '' as $$
declare
  term text := lower(normalize(search_term, NFC) collate pg_catalog."und-x-icu");
begin
  perform public.require_admin(actor, 'content');

  return (
    select coalesce(jsonb_agg(
      case when kind='organizer' then to_jsonb(match) - 'cohort' else to_jsonb(match) end
      order by match.id
    ), '[]'::jsonb)
    from (
      select id, name, cohort
      from (
        select p.parent_id as id, p.name, c.ordinal as cohort
        from public.project_revisions p join public.cohorts c on c.id=p.cohort_id
        where kind='project' and p.state='published'
        union all
        select r.parent_id, r.name, c.ordinal
        from public.review_revisions r left join public.cohorts c on c.id=r.cohort_id
        where kind='review' and r.state='published'
        union all
        select o.parent_id, o.name, null::integer
        from public.organizer_revisions o
        where kind='organizer' and o.state='published'
      ) candidates
      where (cohort_number is null or cohort=cohort_number)
        and (id::text=term or strpos(lower(normalize(name, NFC) collate pg_catalog."und-x-icu"),term)>0)
      order by id
      limit 20
    ) match
  );
end
$$;

revoke execute on function public.lookup_submission_content(uuid,public.content_kind,text,integer)
  from public,anon,authenticated;
grant execute on function public.lookup_submission_content(uuid,public.content_kind,text,integer)
  to service_role;
