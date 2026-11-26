import { contentPreviewRequest } from '@/lib/cms/content-contract';
import { previewMedia } from '@/lib/cms/media';
import { canAdmin } from '@/lib/cms/permissions';
import { rpc } from '@/lib/cms/supabase';

const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(request: Request) {
  if (
    !request.headers.get('content-type')?.startsWith('application/json') ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return Response.json({ message: '요청 형식을 확인해 주세요.' }, { status: 415, headers });
  }

  try {
    if (!(await canAdmin('content'))) {
      return Response.json({ message: '콘텐츠 담당 권한이 필요합니다.' }, { status: 403, headers });
    }
    const parsed = contentPreviewRequest.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ message: '연결된 미디어와 프로젝트 정보를 확인해 주세요.' }, { status: 422, headers });
    }
    const { mediaIds, projectId } = parsed.data;
    const [media, projects] = await Promise.all([
      previewMedia(mediaIds),
      projectId === null
        ? []
        : rpc<{ name: string }[]>('published_content', { kind: 'project', selected_id: projectId }),
    ]);
    return Response.json({ media, projectName: projects[0]?.name ?? null }, { headers });
  } catch {
    return Response.json({ message: '미리보기의 첨부 자료를 불러오지 못했습니다.' }, { status: 503, headers });
  }
}
