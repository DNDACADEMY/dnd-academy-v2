alter table public.media_assets add column publication_pending boolean not null default false;

-- Copies use one key per publish attempt. A killed request leaves an expiring cleanup record.
create table public.cms_media_publication_copies (
  object_key text primary key check (object_key ~ '^published/attempt-[0-9a-f-]{36}/[0-9a-f-]{36}$'),
  cleanup_after timestamptz not null default (now() + interval '15 minutes')
);
create index cms_media_publication_cleanup_due on public.cms_media_publication_copies(cleanup_after);
alter table public.cms_media_publication_copies enable row level security;
revoke all on public.cms_media_publication_copies from anon, authenticated;
grant select, insert, delete on public.cms_media_publication_copies to service_role;

create function public.prepare_media_copy_cleanup(copy_key text) returns boolean
language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.cms_media_publication_copies c where c.object_key = copy_key
  ) then return false; end if;

  -- A committed reference wins, including when the caller did not receive the commit response.
  delete from public.media_assets where bucket = 'cms-public' and object_key = copy_key;
  return true;
exception when foreign_key_violation then
  update public.media_assets set publication_pending = false where bucket = 'cms-public' and object_key = copy_key;
  delete from public.cms_media_publication_copies where object_key = copy_key;
  return false;
end $$;

revoke execute on function public.prepare_media_copy_cleanup(text) from public, anon, authenticated;
grant execute on function public.prepare_media_copy_cleanup(text) to service_role;

create function public.published_review_projects() returns table (id integer, name text)
language sql stable set search_path = '' as $$
  select p.parent_id, p.name
  from public.project_revisions p
  where p.state = 'published' and exists (
    select 1 from public.review_revisions r where r.project_id = p.parent_id and r.state = 'published'
  )
$$;
revoke execute on function public.published_review_projects() from public, anon, authenticated;
grant execute on function public.published_review_projects() to service_role;
