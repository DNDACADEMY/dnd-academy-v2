alter table public.home_revisions
  add constraint home_revisions_dropout_cohort_fk
  foreign key (dropout_cohort) references public.cohorts(ordinal);

create or replace function public.published_home() returns jsonb
language sql stable set search_path = '' as $$
  select public.home_revision_data(r.id) || jsonb_build_object(
    'faqs', coalesce((
      select jsonb_agg(jsonb_build_object('question', f.question, 'answer', f.answer, 'visible', true) order by f.ordinal)
      from public.home_faqs f where f.revision_id = r.id and f.visible
    ), '[]'),
    'sponsors', coalesce((
      select jsonb_agg(jsonb_build_object('name', s.name, 'url', s.url, 'logoPath', s.logo_path,
        'mediaId', s.media_id, 'visible', true) order by s.ordinal)
      from public.home_sponsors s
      left join public.media_assets m on m.id = s.media_id and m.bucket = 'cms-public' and m.ready and m.mime = 'image/webp'
      where s.revision_id = r.id and s.visible and (s.logo_path is not null or m.id is not null)
    ), '[]')
  )
  from public.home_state h join public.home_revisions r on r.id = h.published_id
  where h.singleton
$$;

create or replace function public.write_home(actor uuid, expected_revision bigint, operation text, input jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare
  active public.home_state;
  revision bigint;
  draft jsonb;
  source public.media_assets;
  target_media uuid;
  targets jsonb := '{}'::jsonb;
begin
  perform public.require_admin(actor, 'content');
  select * into strict active from public.home_state where singleton for update;
  if active.draft_id is distinct from expected_revision then raise serialization_failure; end if;

  case operation
    when 'save' then
      revision := public.insert_home_revision(input, actor);
      update public.home_state set draft_id = revision where singleton;
      insert into public.admin_audit(actor, operation, target)
        values (actor, 'home.save', 'home/' || active.draft_id || '->' || revision);
    when 'publish' then
      -- The caller supplies only proposed public asset IDs. Content is read from the checked draft.
      draft := public.home_revision_data(active.draft_id);
      for source in
        select distinct m.* from public.home_sponsors s join public.media_assets m on m.id = s.media_id
        where s.revision_id = active.draft_id and s.visible
      loop
        select m.id into target_media from public.media_assets m
        where m.id = coalesce((input->>source.id::text)::uuid, source.id)
          and m.bucket = 'cms-public' and m.ready and source.ready
          and m.mime = 'image/webp' and m.mime = source.mime
          and m.sha256 = source.sha256 and m.bytes = source.bytes;
        if not found then raise check_violation; end if;
        targets := targets || jsonb_build_object(source.id::text, target_media);
      end loop;
      draft := jsonb_set(draft, '{sponsors}', coalesce((
        select jsonb_agg(
          case when (entry->>'visible')::boolean and entry->>'mediaId' is not null
            then jsonb_set(entry, '{mediaId}', targets->(entry->>'mediaId'))
            else entry end order by ordinal)
        from jsonb_array_elements(draft->'sponsors') with ordinality as items(entry, ordinal)
      ), '[]'));
      revision := public.insert_home_revision(draft, actor);
      update public.home_state set draft_id = revision, published_id = revision where singleton;
      insert into public.admin_audit(actor, operation, target)
        values (actor, 'home.publish', 'home/' || active.published_id || '->' || revision);
    else
      raise invalid_parameter_value;
  end case;
  return jsonb_build_object('revisionId', revision,
    'publishedId', case when operation = 'publish' then revision else active.published_id end,
    'input', public.home_revision_data(revision));
end $$;

create function public.published_project_cards(featured_ids integer[] default null)
returns table (id integer, title text, legacy_thumbnail text, object_key text)
language sql stable set search_path = '' as $$
  select p.parent_id, p.title, p.legacy_thumbnail, m.object_key
  from public.project_revisions p
  join public.cohorts c on c.id = p.cohort_id
  left join public.media_assets m on m.id = p.thumbnail_id and m.ready and m.bucket = 'cms-public'
  where p.state = 'published'
    and (featured_ids is null or p.parent_id = any(featured_ids))
    and (nullif(p.legacy_thumbnail, '') is not null or m.id is not null)
  order by array_position(featured_ids, p.parent_id), c.ordinal desc, p.parent_id
  limit 20
$$;

create function public.published_project_pdf(selected_id integer)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('object_key', m.object_key, 'legacy_pdf', p.legacy_pdf)
  from public.project_revisions p
  left join public.media_assets m on m.id = p.pdf_id and m.ready and m.bucket = 'cms-public'
  where p.state = 'published' and p.parent_id = selected_id
$$;

revoke execute on function public.published_project_cards(integer[]),
  public.published_project_pdf(integer) from public, anon, authenticated;
grant execute on function public.published_project_cards(integer[]),
  public.published_project_pdf(integer) to service_role;
