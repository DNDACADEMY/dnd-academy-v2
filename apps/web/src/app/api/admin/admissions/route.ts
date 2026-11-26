import { readAdmissions, writeAdmissions } from '@/lib/cms/admissions';
import { admissionsRequest } from '@/lib/cms/admissions-contract';
import { canAdmin } from '@/lib/cms/permissions';
import { DatabaseError } from '@/lib/cms/supabase';

export const preferredRegion = 'icn1';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const actor = await canAdmin('admissions');
  if (!actor) return Response.json({ message: '모집 담당 권한이 필요합니다.' }, { status: 403, headers });
  try {
    return Response.json(await readAdmissions(actor), { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  if (
    !request.headers.get('content-type')?.startsWith('application/json') ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return Response.json({ message: '요청 형식을 확인해 주세요.' }, { status: 415, headers });
  }
  const actor = await canAdmin('admissions');
  if (!actor) return Response.json({ message: '모집 담당 권한이 필요합니다.' }, { status: 403, headers });
  const parsed = admissionsRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: '입력값을 확인해 주세요.' }, { status: 422, headers });

  try {
    const result = await writeAdmissions(actor, parsed.data);
    return Response.json(result, { status: 'outcome' in result && result.outcome === 'conflict' ? 409 : 200, headers });
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  const code = error instanceof DatabaseError ? error.code : '';
  if (code === '42501') return Response.json({ message: '모집 담당 권한이 필요합니다.' }, { status: 403, headers });
  if (['P0002', '23503', '23514', '22007'].includes(code)) {
    return Response.json({ message: '대상 기수·이벤트·명단과 발표 일정을 확인해 주세요.' }, { status: 422, headers });
  }
  return Response.json({ message: '요청을 처리하지 못했습니다.' }, { status: 503, headers });
}
