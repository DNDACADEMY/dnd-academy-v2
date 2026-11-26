import { mediaRequest } from '@/lib/cms/content-contract';
import { handleMedia } from '@/lib/cms/media';
import { canAdmin } from '@/lib/cms/permissions';
import { DatabaseError } from '@/lib/cms/supabase';

export const maxDuration = 300;
export const preferredRegion = 'icn1';

const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(request: Request) {
  if (
    !request.headers.get('content-type')?.startsWith('application/json') ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return Response.json({ message: '요청 형식을 확인해 주세요.' }, { status: 415, headers });
  }
  try {
    const actor = await canAdmin('content');
    if (!actor) return Response.json({ message: '콘텐츠 담당 권한이 필요합니다.' }, { status: 403, headers });
    const parsed = mediaRequest.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return Response.json({ message: '파일 형식과 크기를 확인해 주세요.' }, { status: 422, headers });
    return Response.json(await handleMedia(actor, parsed.data), { headers });
  } catch (error) {
    if (error instanceof DatabaseError && error.code === 'MEDIA_LIMIT') {
      return Response.json(
        { message: '이 환경의 파일 상한을 넘었습니다. 크기를 줄여 주세요.' },
        { status: 422, headers },
      );
    }
    if (error instanceof DatabaseError && error.code === 'MEDIA_INVALID') {
      return Response.json({ message: '파일을 검증하지 못했습니다.' }, { status: 422, headers });
    }
    return Response.json({ message: '파일 요청을 처리하지 못했습니다.' }, { status: 503, headers });
  }
}
