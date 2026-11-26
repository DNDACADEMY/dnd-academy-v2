import { contentAssets, editableContent } from '@/lib/cms/content';
import { contentRequest, safeContentLink, validContent } from '@/lib/cms/content-contract';
import { mediaAssets, publishMedia } from '@/lib/cms/media';
import { canAdmin } from '@/lib/cms/permissions';
import { DatabaseError, rpc } from '@/lib/cms/supabase';

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
    const parsed = contentRequest.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ message: '입력값을 확인해 주세요.' }, { status: 422, headers });
    const { kind, id, action, revisionId, editNumber, input } = parsed.data;
    let payload: unknown = {};
    if (action === 'save') {
      if (!input || !validContent(kind, input)) {
        return Response.json({ message: '필수 항목을 확인해 주세요.' }, { status: 422, headers });
      }
      const unchanged = id === null ? undefined : (await editableContent(actor, kind, id))[0];
      if (
        input.links.some(
          (link) =>
            (kind === 'review' && link.kind === 'email') ||
            (!safeContentLink(link.kind, link.url) &&
              !unchanged?.links.some(({ kind, url }) => kind === link.kind && url === link.url)),
        )
      ) {
        return Response.json({ message: '외부 링크 주소를 확인해 주세요.' }, { status: 422, headers });
      }
      const images = [input.thumbnailId, ...(input.images ?? []).map(({ mediaId }) => mediaId)].filter(
        (value): value is string => !!value,
      );
      const assets = await mediaAssets([...images, ...(input.pdfId ? [input.pdfId] : [])]);
      if (
        images.some((value) => !assets.get(value)?.ready || assets.get(value)?.mime !== 'image/webp') ||
        (input.pdfId && (!assets.get(input.pdfId)?.ready || assets.get(input.pdfId)?.mime !== 'application/pdf'))
      ) {
        throw new DatabaseError('MEDIA_INVALID');
      }
      payload = input;
    }
    if (action === 'publish') {
      const [draft] = id === null ? [] : await editableContent(actor, kind, id);
      if (!draft || draft.state !== 'draft' || draft.revisionId !== revisionId || draft.editNumber !== editNumber) {
        throw new DatabaseError('40001');
      }
      payload = await publishMedia(contentAssets(draft));
    }
    const result = await rpc('write_content', {
      actor,
      kind,
      selected_id: id,
      expected_revision: revisionId,
      expected_edit: editNumber,
      operation: action,
      input: payload,
    });
    return Response.json(result, { headers });
  } catch (error) {
    const code = error instanceof DatabaseError ? error.code : '';
    if (code === '42501') return Response.json({ message: '콘텐츠 담당 권한이 필요합니다.' }, { status: 403, headers });
    if (code === '40001')
      return Response.json(
        { message: '다른 변경이 먼저 저장되었습니다. 새로고침해 확인해 주세요.' },
        { status: 409, headers },
      );
    if (['P0002', '23503', '23514', '22023', 'MEDIA_INVALID'].includes(code)) {
      return Response.json({ message: '기수·프로젝트 연결과 미디어를 확인해 주세요.' }, { status: 422, headers });
    }
    return Response.json({ message: '저장 요청을 처리하지 못했습니다.' }, { status: 503, headers });
  }
}
