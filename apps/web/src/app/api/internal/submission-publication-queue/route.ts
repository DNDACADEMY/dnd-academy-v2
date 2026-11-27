import { handleCallback } from '@vercel/queue';
import { z } from 'zod';

import { processSubmissionPublication } from '@/lib/cms/submission-approval';
import { submissionsEnabled } from '@/lib/cms/submissions';

export const maxDuration = 60;

class PublicationPending extends Error {
  constructor(readonly waitSeconds: number) {
    super('Submission publication is still pending');
  }
}

export const POST = handleCallback(
  async (message) => {
    const payload = z.object({ jobId: z.uuid() }).safeParse(message);
    if (!payload.success) return;
    if (!submissionsEnabled()) throw new Error('Submission publication is unavailable');

    const result = await processSubmissionPublication(payload.data.jobId);
    if (result?.state === 'queued') throw new PublicationPending(1);
    if (result?.state === 'processing') throw new PublicationPending(5);
  },
  {
    visibilityTimeoutSeconds: 75,
    retry: (error, { deliveryCount }) => ({
      afterSeconds: error instanceof PublicationPending ? error.waitSeconds : Math.min(60, 2 ** deliveryCount * 4),
    }),
  },
);
