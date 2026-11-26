import { checkApplicant } from '@/lib/cms/public-admissions';

export { options as OPTIONS } from '@/lib/cms/public-admissions';

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  return checkApplicant(request, (await params).eventId);
}
