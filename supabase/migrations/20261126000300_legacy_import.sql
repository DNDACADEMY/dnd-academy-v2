create table public.cms_imported_rows (
  source text not null,
  kind public.content_kind not null,
  record_id integer not null check (record_id >= 0),
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  imported_at timestamptz not null default now(),
  primary key (source, kind, record_id)
);
alter table public.cms_imported_rows enable row level security;
revoke all on public.cms_imported_rows from anon, authenticated;

create table public.cms_legacy_media (
  source_object_key text primary key,
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  conversion text not null,
  asset_id uuid not null references public.media_assets,
  verified_at timestamptz not null default now()
);
alter table public.cms_legacy_media enable row level security;
revoke all on public.cms_legacy_media from anon, authenticated;
