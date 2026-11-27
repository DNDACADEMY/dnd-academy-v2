import 'server-only';
import { send } from '@vercel/queue';

export async function dispatchSubmissionPublication(jobId: string) {
  await send('submission-publications', { jobId }, { idempotencyKey: jobId });
}
