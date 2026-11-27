create function public.published_project_related(selected_id integer)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'projects', coalesce(related.cards, '[]'::jsonb),
    'reviews', coalesce(reviews.cards, '[]'::jsonb)
  )
  from public.project_revisions selected
  join public.cohorts cohort on cohort.id = selected.cohort_id
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', project.parent_id, 'cohort', cohort.ordinal, 'name', project.name, 'title', project.title,
      'legacyThumbnail', project.legacy_thumbnail, 'objectKey', thumbnail.object_key,
      'skill', coalesce(skills.labels, '[]'::jsonb)
    ) order by project.parent_id) as cards
    from public.project_revisions project
    left join public.media_assets thumbnail
      on thumbnail.id = project.thumbnail_id and thumbnail.bucket = 'cms-public' and thumbnail.ready
    cross join lateral (
      select jsonb_agg(skill.label order by entry.ordinal) as labels
      from public.project_revision_skills entry
      join public.skills skill on skill.id = entry.skill_id
      where entry.revision_id = project.id
    ) skills
    where project.cohort_id = selected.cohort_id
      and project.state = 'published' and project.parent_id <> selected.parent_id
  ) related
  cross join lateral (
    select jsonb_agg(public.content_data('review', review.id)
      order by review_cohort.ordinal desc nulls last, review.parent_id) as cards
    from public.review_revisions review
    left join public.cohorts review_cohort on review_cohort.id = review.cohort_id
    where review.project_id = selected.parent_id and review.state = 'published'
  ) reviews
  where selected.parent_id = selected_id and selected.state = 'published'
$$;

revoke execute on function public.published_project_related(integer) from public, anon, authenticated;
grant execute on function public.published_project_related(integer) to service_role;
