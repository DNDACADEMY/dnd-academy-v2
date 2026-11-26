alter table public.media_assets
  add column display_name text check (char_length(display_name) between 1 and 255),
  add column created_at timestamptz not null default now();

update public.media_assets as asset
set display_name = legacy.name
from (
  select distinct on (asset_id)
    asset_id,
    left(regexp_replace(source_object_key, '^.*/', ''), 255) as name
  from public.cms_legacy_media
  where source_object_key !~ '/$'
  order by asset_id, source_object_key
) as legacy
where asset.id = legacy.asset_id;

create index media_assets_library_order
  on public.media_assets (mime, created_at desc, id desc)
  where ready;
