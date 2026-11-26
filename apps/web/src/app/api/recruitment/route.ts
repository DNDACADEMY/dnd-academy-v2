import { readRecruitmentControls } from '@/lib/cms/recruitment';

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const controls = process.env.DND_SUPABASE_URL ? await readRecruitmentControls() : null;
    if (!controls) return Response.json({ settings: null }, { headers });
    const { version: _version, cohortId: _cohortId, ...settings } = controls;
    if (!['auto', 'open'].includes(settings.applicationMode)) {
      settings.developerUrl = null;
      settings.designerUrl = null;
    }
    return Response.json({ settings }, { headers });
  } catch {
    return Response.json({ message: '모집 버튼 설정을 불러오지 못했습니다.' }, { status: 503, headers });
  }
}
