import 'server-only';
import { createHash, randomUUID } from 'node:crypto';

import sharp from 'sharp';
import type { z } from 'zod';

import { type MediaItem, type MediaLibrary, type mediaRequest, mediaMax } from './content-contract';
import { publishWithCopies } from './media-publication-flow';
import { database, DatabaseError, rpc, supabaseUrl } from './supabase';

const draftBucket = 'cms-drafts';
const publicBucket = 'cms-public';
type Asset = {
  id: string;
  object_key: string;
  bucket: string;
  bytes: number;
  sha256: string;
  mime: MediaItem['mime'];
  display_name: string | null;
  ready: boolean;
  publication_pending?: boolean;
};

export function publicMedia(key: string) {
  return new URL(
    `/storage/v1/object/public/${publicBucket}/${key.split('/').map(encodeURIComponent).join('/')}`,
    supabaseUrl(),
  ).href;
}

const assetColumns = 'id,object_key,bucket,bytes,sha256,mime,ready,display_name,publication_pending';

export async function mediaAssets(ids: string[]) {
  if (!ids.length) return new Map<string, Asset>();
  const result = await database()
    .from('media_assets')
    .select(assetColumns)
    .in('id', [...new Set(ids)]);
  if (result.error) throw new DatabaseError(result.error.code);
  return new Map((result.data as Asset[]).map((asset) => [asset.id, asset]));
}

export async function previewMedia(ids: string[]) {
  return mediaItems([...(await mediaAssets(ids)).values()].filter((asset) => asset.ready));
}

async function mediaItems(records: Asset[]): Promise<MediaItem[]> {
  const draftKeys = records.filter((asset) => asset.bucket === draftBucket).map((asset) => asset.object_key);
  const signed = new Map<string, string>();
  if (draftKeys.length) {
    const { data, error } = await database().storage.from(draftBucket).createSignedUrls(draftKeys, 300);
    if (error) throw new DatabaseError('MEDIA_INVALID');
    for (const item of data) {
      if (item.path && item.signedUrl && !item.error) signed.set(item.path, item.signedUrl);
    }
  }
  return records.flatMap((asset) => {
    const url = asset.bucket === publicBucket ? publicMedia(asset.object_key) : signed.get(asset.object_key);
    return url ? [{ id: asset.id, mime: asset.mime, name: asset.display_name, bytes: asset.bytes, url }] : [];
  });
}

async function digest(url: string, mime: string, expectedBytes: number, verifyImage = false) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(120000) });
  if (!response.ok || !response.body || response.headers.get('content-type')?.split(';')[0] !== mime) {
    throw new DatabaseError('MEDIA_INVALID');
  }
  const image: Buffer[] = [];
  const hash = createHash('sha256');
  let bytes = 0;
  let start = Buffer.alloc(0);
  let end = Buffer.alloc(0);
  const reader = response.body.getReader();
  for (let part = await reader.read(); !part.done; part = await reader.read()) {
    bytes += part.value.byteLength;
    if (bytes > expectedBytes || bytes > mediaMax) {
      await reader.cancel();
      throw new DatabaseError('MEDIA_INVALID');
    }
    hash.update(part.value);
    const chunk = Buffer.from(part.value);
    if (verifyImage && mime === 'image/webp') image.push(chunk);
    if (start.length < 16) start = Buffer.concat([start, chunk.subarray(0, 16 - start.length)]);
    if (mime === 'application/pdf') end = Buffer.concat([end, chunk]).subarray(-1024);
  }
  const valid =
    mime === 'image/webp'
      ? start.toString('ascii', 0, 4) === 'RIFF' &&
        start.toString('ascii', 8, 12) === 'WEBP' &&
        ['VP8 ', 'VP8L', 'VP8X'].includes(start.toString('ascii', 12, 16)) &&
        start.readUInt32LE(4) + 8 === bytes
      : start.toString('ascii', 0, 5) === '%PDF-' && /%%EOF\s*$/.test(end.toString('latin1'));
  if (!valid || bytes !== expectedBytes) throw new DatabaseError('MEDIA_INVALID');
  if (image.length) {
    try {
      await sharp(Buffer.concat(image), { limitInputPixels: 45_000_000, failOn: 'error' }).stats();
    } catch {
      throw new DatabaseError('MEDIA_INVALID');
    }
  }
  return hash.digest('hex');
}

async function signedRead(bucket: string, key: string) {
  const { data, error } = await database().storage.from(bucket).createSignedUrl(key, 300);
  if (error) throw new DatabaseError('MEDIA_INVALID');
  return data.signedUrl;
}

async function recordAsset(asset: Omit<Asset, 'id' | 'ready'>) {
  const db = database();
  const { error } = await db
    .from('media_assets')
    .upsert(asset, { onConflict: 'bucket,object_key', ignoreDuplicates: true });
  if (error) throw new DatabaseError(error.code);
  const result = await db
    .from('media_assets')
    .select('id,sha256,bytes,mime,ready')
    .eq('bucket', asset.bucket)
    .eq('object_key', asset.object_key)
    .single();
  if (
    result.error ||
    !result.data.ready ||
    result.data.sha256 !== asset.sha256 ||
    result.data.bytes !== asset.bytes ||
    result.data.mime !== asset.mime
  )
    throw new DatabaseError('MEDIA_INVALID');
  return result.data.id as string;
}

export async function handleMedia(actor: string, request: z.infer<typeof mediaRequest>) {
  const db = database();
  if (request.action === 'library') {
    const pageSize = 18;
    const start = request.page * pageSize;
    let query = db
      .from('media_assets')
      .select(assetColumns)
      .eq('ready', true)
      .eq('publication_pending', false)
      .eq('mime', request.mime);
    if (request.query) {
      const pattern = request.query.replace(/[\\%_]/g, '\\$&');
      query = query.ilike('display_name', `%${pattern}%`);
    }
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(start, start + pageSize);
    if (error) throw new DatabaseError(error.code);
    return {
      items: await mediaItems((data as Asset[]).slice(0, pageSize)),
      hasMore: data.length > pageSize,
    } satisfies MediaLibrary;
  }

  if (request.action === 'preview') {
    const asset = (await mediaAssets([request.id])).get(request.id);
    if (!asset?.ready) throw new DatabaseError('MEDIA_INVALID');
    return {
      url:
        asset.bucket === publicBucket
          ? publicMedia(asset.object_key)
          : await signedRead(asset.bucket, asset.object_key),
      mime: asset.mime,
    };
  }

  if (request.action === 'upload') {
    const configuredMax = Number(process.env.DND_CMS_UPLOAD_LIMIT_BYTES) || mediaMax;
    if (request.bytes > Math.min(configuredMax, mediaMax)) throw new DatabaseError('MEDIA_LIMIT');
    const { data, error } = await db
      .from('cms_uploads')
      .insert({ actor, mime: request.mime, bytes: request.bytes })
      .select('object_key')
      .single();
    if (error) throw new DatabaseError(error.code);
    const { data: upload, error: uploadError } = await db.storage
      .from(draftBucket)
      .createSignedUploadUrl(data.object_key);
    if (uploadError) throw new DatabaseError('MEDIA_INVALID');
    const endpoint = new URL('/storage/v1/upload/resumable/sign', supabaseUrl());
    if (endpoint.hostname.endsWith('.supabase.co'))
      endpoint.hostname = endpoint.hostname.replace('.supabase.co', '.storage.supabase.co');
    return {
      key: data.object_key as string,
      url: upload.signedUrl,
      token: upload.token,
      endpoint: endpoint.href,
      bucket: draftBucket,
    };
  }

  const { data: reservation, error } = await db
    .from('cms_uploads')
    .select('mime,bytes')
    .eq('actor', actor)
    .eq('object_key', request.key)
    .single();
  if (error) throw new DatabaseError('MEDIA_INVALID');
  const sha256 = await digest(await signedRead(draftBucket, request.key), reservation.mime, reservation.bytes, true);
  return {
    id: await recordAsset({
      bucket: draftBucket,
      object_key: request.key,
      mime: reservation.mime,
      bytes: reservation.bytes,
      sha256,
      display_name: request.name ?? null,
    }),
  };
}

const copiesTable = 'cms_media_publication_copies';

async function removeCopyRecord(key: string) {
  const { error } = await database().from(copiesTable).delete().eq('object_key', key);
  if (error) throw new DatabaseError(error.code);
}

async function keepCopy(key: string) {
  const { error } = await database()
    .from('media_assets')
    .update({ publication_pending: false })
    .eq('bucket', publicBucket)
    .eq('object_key', key);
  if (error) throw new DatabaseError(error.code);
  await removeCopyRecord(key);
}

async function discardCopy(key: string) {
  if (!(await rpc<boolean>('prepare_media_copy_cleanup', { copy_key: key }))) return;
  const { error } = await database().storage.from(publicBucket).remove([key]);
  if (error) throw new DatabaseError('MEDIA_INVALID');
  await removeCopyRecord(key);
}

async function finishCopies(keys: string[], committed: boolean) {
  // Keep failed cleanup records for the next publication. Do not mask the publish outcome.
  const results = await Promise.allSettled(keys.map((key) => (committed ? keepCopy(key) : discardCopy(key))));
  if (results.some((result) => result.status === 'rejected')) {
    console.warn('CMS publication media cleanup deferred');
  }
}

async function cleanExpiredCopies() {
  const { data, error } = await database()
    .from(copiesTable)
    .select('object_key')
    .lt('cleanup_after', new Date().toISOString())
    .order('cleanup_after')
    .limit(8);
  if (!error)
    await finishCopies(
      data.map(({ object_key }) => object_key as string),
      false,
    );
}

export async function publishWithMedia<Result>(
  ids: string[],
  commit: (replacements: Record<string, string>) => Promise<Result>,
) {
  await cleanExpiredCopies();
  return publishWithCopies((onCopy) => copyPublicationAssets(ids, onCopy), commit, finishCopies);
}

async function copyPublicationAssets(ids: string[], onCopy: (key: string) => void) {
  const assets = await mediaAssets(ids);
  const replacements: Record<string, string> = {};
  const attempt = randomUUID();
  for (const id of new Set(ids)) {
    const asset = assets.get(id);
    if (!asset?.ready) throw new DatabaseError('MEDIA_INVALID');
    if (asset.bucket === publicBucket) continue;
    const key = `published/attempt-${attempt}/${asset.id}`;
    const { error: reservation } = await database().from(copiesTable).insert({ object_key: key });
    if (reservation) throw new DatabaseError(reservation.code);
    onCopy(key);
    const storage = database().storage.from(draftBucket);
    const { error: copy } = await storage.copy(asset.object_key, key, { destinationBucket: publicBucket });
    if (copy) throw new DatabaseError('MEDIA_INVALID');
    const actual = await digest(publicMedia(key), asset.mime, asset.bytes);
    if (actual !== asset.sha256) throw new DatabaseError('MEDIA_INVALID');
    replacements[id] = await recordAsset({
      bucket: publicBucket,
      object_key: key,
      mime: asset.mime,
      bytes: asset.bytes,
      sha256: actual,
      publication_pending: true,
      display_name: asset.display_name,
    });
  }
  return replacements;
}
