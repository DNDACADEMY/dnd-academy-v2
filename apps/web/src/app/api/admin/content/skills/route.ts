import { canAdmin } from '@/lib/cms/permissions';
import { database } from '@/lib/cms/supabase';

const headers = { 'Cache-Control': 'private, no-store' };
const pageSize = 500;

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

    const client = database();
    const skills: string[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client
        .from('skills')
        .select('label')
        .order('id')
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      skills.push(...data.map(({ label }) => label));
      if (data.length < pageSize) break;
    }

    return Response.json({ skills: skills.toSorted((a, b) => a.localeCompare(b, 'ko')) }, { headers });
  } catch {
    return Response.json({ message: '기술 태그를 불러오지 못했습니다.' }, { status: 503, headers });
  }
}
