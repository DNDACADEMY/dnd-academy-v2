import { timingSafeEqual } from 'node:crypto';

import { processSubmissionPublication } from '@/lib/cms/submission-approval';
import { submissionError, submissionHeaders, submissionsEnabled } from '@/lib/cms/submissions';

export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.DND_SUBMISSION_WORKER_SECRET;
  if (!submissionsEnabled() || !secret) return new Response(null, { status: 404, headers: submissionHeaders });
  const expected = Buffer.from('Bearer ' + secret);
  const presented = Buffer.from(request.headers.get('authorization') ?? '');
  if (expected.length !== presented.length || !timingSafeEqual(expected, presented)) {
    return new Response(null, { status: 403, headers: submissionHeaders });
  }
  try {
    const job = await processSubmissionPublication(null);
    return Response.json({ state: job?.state ?? 'idle' }, { headers: submissionHeaders });
  } catch (error) {
    return submissionError(error);
  }
}
