import { cookies } from 'next/headers';
import { z } from 'zod';

import { mediaRequest } from '@/lib/cms/content-contract';
import { handleMedia, previewMedia } from '@/lib/cms/media';
import {
  submissionCookie,
  submissionError,
  submissionHeaders,
  submissionsEnabled,
  submissionSessionCredential,
} from '@/lib/cms/submissions';
import { DatabaseError, rpc } from '@/lib/cms/supabase';

export const maxDuration = 60;
type Context = { params: Promise<{ id: string }> };

async function getLink(context: Context) {
  const parsed = z.uuid().safeParse((await context.params).id);
  if (!parsed.success) throw new DatabaseError('42501');
  const token = (await cookies()).get(submissionCookie(parsed.data))?.value;
  if (!token) throw new DatabaseError('42501');
  return { selected_link: parsed.data, credential: await submissionSessionCredential(parsed.data, token) };
}

export async function POST(request: Request, context: Context) {
  if (!submissionsEnabled()) return new Response(null, { status: 404, headers: submissionHeaders });
  const origin = request.headers.get('origin');
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site' ||
    !request.headers.get('content-type')?.startsWith('application/json')
  ) {
    return Response.json({ message: '요청 출처를 확인해 주세요.' }, { status: 403, headers: submissionHeaders });
  }
  try {
    const link = await getLink(context);
    const grant = await rpc<{ kind: string }>('submission_require_link', link);
    const parsed = mediaRequest.safeParse(await request.json().catch(() => null));
    if (
      !parsed.success ||
      grant.kind === 'review' ||
      parsed.data.action === 'library' ||
      parsed.data.action === 'preview' ||
      (grant.kind === 'organizer' && parsed.data.action === 'upload' && parsed.data.mime !== 'image/webp')
    ) {
      throw new DatabaseError('MEDIA_INVALID');
    }
    return Response.json(await handleMedia({ submissionLinkId: link.selected_link }, parsed.data), {
      headers: submissionHeaders,
    });
  } catch (error) {
    return submissionError(error);
  }
}

export async function GET(request: Request, context: Context) {
  if (!submissionsEnabled()) return new Response(null, { status: 404, headers: submissionHeaders });
  try {
    const link = await getLink(context);
    const asset = z.uuid().safeParse(new URL(request.url).searchParams.get('asset'));
    if (!asset.success) throw new DatabaseError('MEDIA_INVALID');
    await rpc('submission_media_access', { ...link, asset: asset.data });
    const [item] = await previewMedia([asset.data]);
    if (!item) throw new DatabaseError('MEDIA_INVALID');
    const range = request.headers.get('range');
    const upstream = await fetch(item.url, { headers: range ? { Range: range } : {}, cache: 'no-store' });
    if (!upstream.ok && upstream.status !== 416) throw new DatabaseError('MEDIA_INVALID');
    const headers = new Headers({
      ...submissionHeaders,
      'Content-Type': item.mime,
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin',
    });
    for (const name of ['Content-Length', 'Content-Range', 'Accept-Ranges']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return submissionError(error);
  }
}
