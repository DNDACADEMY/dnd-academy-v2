create function public.content_workspace(actor uuid, kind public.content_kind, selected_id integer default null)
returns jsonb language plpgsql set search_path = '' as $$
declare
  revision_table text := kind || '_revisions';
  author_column text := case when kind = 'organizer' then 'r.author' else 'null::text' end;
  position_column text := case when kind <> 'project' then 'r.position' else 'null::text' end;
  cohort_column text := case when kind = 'organizer' then 'null::integer' else 'c.ordinal' end;
  cohort_join text := case when kind = 'organizer' then '' else 'left join public.cohorts c on c.id = r.cohort_id' end;
  summaries jsonb;
  selected jsonb;
begin
  perform public.require_admin(actor, 'content');
  execute format($query$
    select coalesce(jsonb_agg(to_jsonb(summary) order by summary.id), '[]')
    from (
      select distinct on (r.parent_id) r.parent_id as id, r.name, r.state,
        p.id as "liveRevisionId", %s as author, %s as position, %s as cohort
      from public.%I r
      left join public.%I p on p.parent_id = r.parent_id and p.state = 'published'
      %s
      order by r.parent_id, r.state, r.version desc
    ) summary
  $query$, author_column, position_column, cohort_column, revision_table, revision_table, cohort_join)
  into summaries;

  if selected_id is not null then
    select item into selected from public.editable_content(actor, kind, selected_id) item;
  end if;

  return jsonb_build_object('rows', summaries, 'initial', selected);
end $$;

revoke execute on function public.content_workspace(uuid, public.content_kind, integer) from public, anon, authenticated;
grant execute on function public.content_workspace(uuid, public.content_kind, integer) to service_role;
