import { revalidatePath } from 'next/cache';

import { editableHome, homeLogoIds } from '@/lib/cms/home';
import { homeRequest, type HomeInput, type HomeWorkspace } from '@/lib/cms/home-contract';
import { mediaAssets, publishMedia } from '@/lib/cms/media';
import { canAdmin } from '@/lib/cms/permissions';
import { DatabaseError, rpc } from '@/lib/cms/supabase';

const headers = { 'Cache-Control': 'private, no-store' };
export const maxDuration = 300;

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
    const parsed = homeRequest.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ message: '홈의 입력값을 확인해 주세요.' }, { status: 422, headers });
    const { action, revisionId } = parsed.data;
    let input: HomeInput;
    if (parsed.data.action === 'save') {
      input = parsed.data.input;
    } else {
      const draft = await editableHome(actor);
      if (!draft || draft.revisionId !== revisionId) throw new DatabaseError('40001');
      input = draft.input;
    }
    const ids = homeLogoIds(input);
    const assets = await mediaAssets(ids);
    if (ids.some((id) => !assets.get(id)?.ready || assets.get(id)?.mime !== 'image/webp')) {
      throw new DatabaseError('MEDIA_INVALID');
    }
    if (action === 'publish') {
      const replacements = await publishMedia(ids);
      input.sponsors = input.sponsors.map((sponsor) => ({
        ...sponsor,
        mediaId: sponsor.mediaId ? (replacements[sponsor.mediaId] ?? sponsor.mediaId) : null,
      }));
    }
    const result = await rpc<HomeWorkspace>('write_home', {
      actor,
      expected_revision: revisionId,
      operation: action,
      input,
    });
    if (action === 'publish') revalidatePath('/');
    return Response.json(result, { headers });
  } catch (error) {
    const code = error instanceof DatabaseError ? error.code : '';
    if (code === '42501') return Response.json({ message: '콘텐츠 담당 권한이 필요합니다.' }, { status: 403, headers });
    if (code === '40001')
      return Response.json(
        { message: '다른 변경이 먼저 저장되었습니다. 새로고침해 주세요.' },
        { status: 409, headers },
      );
    if (['23503', '23514', 'MEDIA_INVALID'].includes(code)) {
      return Response.json({ message: '연결한 프로젝트 또는 후원사 로고를 확인해 주세요.' }, { status: 422, headers });
    }
    return Response.json({ message: '홈을 저장하지 못했습니다.' }, { status: 503, headers });
  }
}
