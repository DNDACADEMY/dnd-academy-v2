import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { revalidateWebPath, updateCurrentApplicantCount } from '@/app/api/handler';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

export async function PUT() {
  const currentApplicantCountForm = await updateCurrentApplicantCount();

  revalidatePath('/current-applicant-count');
  const response = await revalidateWebPath('/');

  if (!response.revalidated) {
    return NextResponse.json(currentApplicantCountForm, {
      status: 400,
    });
  }

  return NextResponse.json(currentApplicantCountForm, {
    status: 200,
  });
}
