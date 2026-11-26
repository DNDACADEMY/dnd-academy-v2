alter table public.cms_media_publication_copies
  drop constraint cms_media_publication_copies_object_key_check,
  add constraint cms_media_publication_copies_object_key_check check (
    object_key ~ '^(published/attempt-[0-9a-f-]{36}/[0-9a-f-]{36}|s3/cms/published/attempt-[0-9a-f-]{36}/[0-9a-f-]{36}[.](pdf|webp))$'
  );
