import { NextRequest, NextResponse } from 'next/server';

import { updateCurrentApplicantCount } from '@/app/api/handler';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  const currentApplicantCountForm = await updateCurrentApplicantCount();

  return NextResponse.json(currentApplicantCountForm, {
    status: 200,
  });
}
