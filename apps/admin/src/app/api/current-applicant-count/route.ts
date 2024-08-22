import { NextResponse } from 'next/server';

import { updateCurrentApplicantCount } from '@/app/api/handler';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

export async function PUT() {
  const currentApplicantCountForm = await updateCurrentApplicantCount();

  return NextResponse.json(currentApplicantCountForm, {
    status: 200,
  });
}
