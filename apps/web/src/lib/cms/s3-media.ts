import 'server-only';
import {
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider';

import type { MediaItem } from './content-contract';
import { DatabaseError } from './supabase';

const draftCache = 'private, no-store';
const publicCache = 'public, max-age=31536000, immutable';
const expiresIn = 600;
export const s3PartBytes = 8 * 1024 * 1024;
export const s3MultipartThreshold = 6 * 1024 * 1024;
const keyPattern = /^s3\/cms\/(?:drafts\/[a-f0-9-]{36}|published\/attempt-[a-f0-9-]{36}\/[a-f0-9-]{36})\.(?:pdf|webp)$/;

export function isS3Media(key: string) {
  return key.startsWith('s3/cms/');
}

export function mediaExtension(mime: MediaItem['mime']) {
  return mime === 'application/pdf' ? 'pdf' : 'webp';
}

function assertKey(key: string) {
  if (!keyPattern.test(key)) throw new DatabaseError('MEDIA_INVALID');
}

function storage() {
  const bucket = process.env.DND_CMS_S3_BUCKET;
  const region = process.env.DND_CMS_S3_REGION;
  const roleArn = process.env.DND_CMS_AWS_ROLE_ARN;
  if (!bucket || !region || !roleArn) throw new DatabaseError('MEDIA_STORAGE_UNAVAILABLE');
  return {
    Bucket: bucket,
    client: new S3Client({
      region,
      credentials: awsCredentialsProvider({ roleArn }),
      requestChecksumCalculation: 'WHEN_REQUIRED',
    }),
  };
}

export function s3PublicMedia(key: string) {
  assertKey(key);
  const origin = process.env.DND_CMS_MEDIA_CDN_ORIGIN;
  if (!origin || !key.startsWith('s3/cms/published/')) throw new DatabaseError('MEDIA_STORAGE_UNAVAILABLE');
  return new URL(key, origin).href;
}

const draftHeaders = (mime: string) => ({
  'Content-Type': mime,
  'Cache-Control': draftCache,
  'If-None-Match': '*',
});

export async function s3UploadUrl(key: string, mime: MediaItem['mime'], bytes: number) {
  assertKey(key);
  const { client, Bucket } = storage();
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket,
      Key: key,
      ContentType: mime,
      ContentLength: bytes,
      CacheControl: draftCache,
      IfNoneMatch: '*',
    }),
    { expiresIn, signableHeaders: new Set(['content-type', 'content-length', 'cache-control', 'if-none-match']) },
  );
  return { url, headers: draftHeaders(mime) };
}

export async function startS3Multipart(key: string, mime: MediaItem['mime']) {
  assertKey(key);
  const { Bucket, client } = storage();
  const result = await client.send(
    new CreateMultipartUploadCommand({ Bucket, Key: key, ContentType: mime, CacheControl: draftCache }),
  );
  if (!result.UploadId) throw new DatabaseError('MEDIA_INVALID');
  return result.UploadId;
}

function expectedPartBytes(bytes: number, part: number) {
  return Math.min(s3PartBytes, bytes - (part - 1) * s3PartBytes);
}

async function readParts(key: string, uploadId: string, bytes: number) {
  assertKey(key);
  const { Bucket, client } = storage();
  try {
    const result = await client.send(new ListPartsCommand({ Bucket, Key: key, UploadId: uploadId }));
    if (result.IsTruncated) throw new DatabaseError('MEDIA_INVALID');
    return (result.Parts ?? []).flatMap(({ PartNumber, ETag, Size }) =>
      PartNumber && ETag && Size === expectedPartBytes(bytes, PartNumber) && Size > 0
        ? [{ PartNumber, ETag, Size }]
        : [],
    );
  } catch (error) {
    if (!(error instanceof S3ServiceException) || error.name !== 'NoSuchUpload') throw error;
    const { ContentLength } = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
    if (ContentLength !== bytes) throw new DatabaseError('MEDIA_INVALID');
    return null;
  }
}

export async function s3MultipartUrls(key: string, uploadId: string, bytes: number) {
  const found = await readParts(key, uploadId, bytes);
  if (!found) return { parts: [], uploaded: bytes };
  const { Bucket, client } = storage();
  const uploaded = new Set(found.map(({ PartNumber }) => PartNumber));
  const missing = Array.from({ length: Math.ceil(bytes / s3PartBytes) }, (_, index) => index + 1).filter(
    (part) => !uploaded.has(part),
  );
  const parts = await Promise.all(
    missing.map(async (part) => {
      const size = expectedPartBytes(bytes, part);
      return {
        offset: (part - 1) * s3PartBytes,
        bytes: size,
        url: await getSignedUrl(
          client,
          new UploadPartCommand({ Bucket, Key: key, UploadId: uploadId, PartNumber: part, ContentLength: size }),
          { expiresIn, signableHeaders: new Set(['content-length']) },
        ),
      };
    }),
  );
  return { parts, uploaded: found.reduce((sum, part) => sum + part.Size, 0) };
}

export async function finishS3Multipart(key: string, uploadId: string, bytes: number) {
  const found = await readParts(key, uploadId, bytes);
  if (!found) return;
  if (found.length !== Math.ceil(bytes / s3PartBytes)) throw new DatabaseError('MEDIA_INVALID');
  const { Bucket, client } = storage();
  try {
    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket,
        Key: key,
        UploadId: uploadId,
        IfNoneMatch: '*',
        MultipartUpload: {
          Parts: found
            .sort((first, second) => first.PartNumber - second.PartNumber)
            .map(({ PartNumber, ETag }) => ({
              PartNumber,
              ETag,
            })),
        },
      }),
    );
  } catch (error) {
    // Another verification can finish the same reservation first.
    if (!(error instanceof S3ServiceException) || !['NoSuchUpload', 'PreconditionFailed'].includes(error.name)) {
      throw error;
    }
    const result = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
    if (result.ContentLength !== bytes) throw new DatabaseError('MEDIA_INVALID');
  }
}

export async function s3SignedRead(key: string) {
  assertKey(key);
  const { Bucket, client } = storage();
  return getSignedUrl(client, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: 300 });
}

export async function publishS3Media(source: string, target: string, mime: MediaItem['mime']) {
  assertKey(source);
  assertKey(target);
  const { Bucket, client } = storage();
  await client.send(
    new CopyObjectCommand({
      Bucket,
      Key: target,
      CopySource: `${Bucket}/${source}`,
      ContentType: mime,
      CacheControl: publicCache,
      MetadataDirective: 'REPLACE',
    }),
  );
}

export async function deleteS3Media(key: string) {
  assertKey(key);
  const { Bucket, client } = storage();
  await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
}
