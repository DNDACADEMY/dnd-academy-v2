alter table public.cms_uploads
  add column storage_provider text not null default 'supabase' check (storage_provider in ('supabase', 's3')),
  add column multipart_id text,
  add constraint cms_uploads_multipart_provider check (multipart_id is null or storage_provider = 's3');

alter table public.cms_media_publication_copies
  drop constraint cms_media_publication_copies_object_key_check,
  add constraint cms_media_publication_copies_object_key_check check (
    object_key ~ '^(published/attempt-[0-9a-f-]{36}/[0-9a-f-]{36}|s3/cms-preview/published/attempt-[0-9a-f-]{36}/[0-9a-f-]{36}[.](pdf|webp))$'
  );
