begin;

create type public.organizer_activity_status as enum ('active', 'former');

alter table public.organizer_revisions
  add column activity_status public.organizer_activity_status generated always as (
    case when is_archived then 'former'::public.organizer_activity_status
    else 'active'::public.organizer_activity_status end
  ) stored;

comment on column public.organizer_revisions.activity_status is
  'Membership activity, independent of the revision publication state. Derived from the legacy write field.';

create function public.published_organizer_directory()
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'active', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.parent_id, 'name', o.name, 'dndPosition', o.position,
        'oneLineIntroduction', o.introduction, 'emoji', o.emoji,
        'legacyThumbnail', o.legacy_thumbnail, 'objectKey', m.object_key,
        'technicalStack', coalesce((
          select jsonb_agg(s.label order by x.ordinal) from public.organizer_revision_skills x
          join public.skills s on s.id = x.skill_id where x.revision_id = o.id
        ), '[]'::jsonb)
      ) order by o.parent_id)
      from public.organizer_revisions o
      left join public.media_assets m on m.id = o.thumbnail_id and m.bucket = 'cms-public'
        and m.ready and not m.publication_pending
      where o.state = 'published' and o.activity_status = 'active'
    ), '[]'::jsonb),
    'former', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.parent_id, 'name', o.name) order by o.parent_id)
      from public.organizer_revisions o
      where o.state = 'published' and o.activity_status = 'former'
    ), '[]'::jsonb)
  )
$$;

revoke execute on function public.published_organizer_directory() from public, anon, authenticated;
grant execute on function public.published_organizer_directory() to service_role;

commit;
