import 'server-only';
import { createHash } from 'node:crypto';

import type { z } from 'zod';

import { type mediaRequest, mediaMax } from './content-contract';
import { database, DatabaseError, supabaseUrl } from './supabase';

const draftBucket = 'cms-drafts';
const publicBucket = 'cms-public';
type Asset = {
  id: string;
  object_key: string;
  bucket: string;
  bytes: number;
  sha256: string;
  mime: string;
  ready: boolean;
};

export function publicMedia(key: string) {
  return new URL(
    `/storage/v1/object/public/${publicBucket}/${key.split('/').map(encodeURIComponent).join('/')}`,
    supabaseUrl(),
  ).href;
}

export async function mediaAssets(ids: string[]) {
  if (!ids.length) return new Map<string, Asset>();
  const result = await database()
    .from('media_assets')
    .select('id,object_key,bucket,bytes,sha256,mime,ready')
    .in('id', [...new Set(ids)]);
  if (result.error) throw new DatabaseError(result.error.code);
  return new Map((result.data as Asset[]).map((asset) => [asset.id, asset]));
}

async function digest(url: string, mime: string, expectedBytes: number) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(120000) });
  if (!response.ok || !response.body || response.headers.get('content-type')?.split(';')[0] !== mime) {
    throw new DatabaseError('MEDIA_INVALID');
  }
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
    const endpoint = new URL('/storage/v1/upload/resumable', supabaseUrl());
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
  const sha256 = await digest(await signedRead(draftBucket, request.key), reservation.mime, reservation.bytes);
  return {
    id: await recordAsset({
      bucket: draftBucket,
      object_key: request.key,
      mime: reservation.mime,
      bytes: reservation.bytes,
      sha256,
    }),
  };
}

export async function publishMedia(ids: string[]) {
  const assets = await mediaAssets(ids);
  const replacements: Record<string, string> = {};
  for (const id of new Set(ids)) {
    const asset = assets.get(id);
    if (!asset?.ready) throw new DatabaseError('MEDIA_INVALID');
    if (asset.bucket === publicBucket) continue;
    const key = `published/${asset.id}`;
    const storage = database().storage.from(draftBucket);
    // A retried copy may already exist. Read the destination and verify the bytes in either case.
    await storage.copy(asset.object_key, key, { destinationBucket: publicBucket });
    const actual = await digest(publicMedia(key), asset.mime, asset.bytes);
    if (actual !== asset.sha256) throw new DatabaseError('MEDIA_INVALID');
    replacements[id] = await recordAsset({
      bucket: publicBucket,
      object_key: key,
      mime: asset.mime,
      bytes: asset.bytes,
      sha256: actual,
    });
  }
  return replacements;
}
