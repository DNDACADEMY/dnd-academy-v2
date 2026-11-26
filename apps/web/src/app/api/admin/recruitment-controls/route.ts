import { canAdmin } from '@/lib/cms/permissions';
import { writeRecruitmentControls } from '@/lib/cms/recruitment';
import { recruitmentRequest } from '@/lib/cms/recruitment-contract';
import { DatabaseError } from '@/lib/cms/supabase';

const headers = { 'Cache-Control': 'private, no-store' };

export async function POST(request: Request) {
  if (
    !request.headers.get('content-type')?.startsWith('application/json') ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return Response.json({ message: '요청 형식을 확인해 주세요.' }, { status: 415, headers });
  }
  try {
    const actor = await canAdmin('admissions');
    if (!actor) return Response.json({ message: '모집 담당 권한이 필요합니다.' }, { status: 403, headers });
    const parsed = recruitmentRequest.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ message: '모집 버튼 설정을 확인해 주세요.' }, { status: 422, headers });
    return Response.json(await writeRecruitmentControls(actor, parsed.data.version, parsed.data.input), { headers });
  } catch (error) {
    const code = error instanceof DatabaseError ? error.code : '';
    if (code === '42501') return Response.json({ message: '모집 담당 권한이 필요합니다.' }, { status: 403, headers });
    if (code === '40001')
      return Response.json(
        { message: '다른 운영진이 먼저 저장했습니다. 새로고침해 주세요.' },
        { status: 409, headers },
      );
    if (['23503', '23514'].includes(code))
      return Response.json({ message: '대상 기수, 일정, 링크 주소를 확인해 주세요.' }, { status: 422, headers });
    return Response.json({ message: '모집 버튼 설정을 저장하지 못했습니다.' }, { status: 503, headers });
  }
}
