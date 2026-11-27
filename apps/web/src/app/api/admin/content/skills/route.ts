import { contentSkills } from '@/lib/cms/content';
import { canAdmin } from '@/lib/cms/permissions';

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

    return Response.json({ skills: await contentSkills() }, { headers });
  } catch {
    return Response.json({ message: '기술 태그를 불러오지 못했습니다.' }, { status: 503, headers });
  }
}
