import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

import type { Submission, SubmissionJob, SubmissionWorkspace } from './submission-contract';
import { DatabaseError, rpc } from './supabase';

export const submissionHeaders = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
};

export const submissionCookie = (id: string) => 'dnd-submission-' + id;
export const submissionToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export const submissionsEnabled = () => process.env.DND_CONTENT_SUBMISSIONS === 'enabled';

export async function submissionWorkspace(actor: string, cohort: number | null): Promise<SubmissionWorkspace> {
  const workspace = await rpc<Omit<SubmissionWorkspace, 'jobs'>>('admin_submission_workspace', {
    actor,
    cohort_number: cohort,
  });
  const ids = workspace.links.filter(({ state }) => state === 'submitted').map(({ id }) => id);
  const jobs = ids.length ? await rpc<SubmissionJob[]>('list_submission_publications', { actor, link_ids: ids }) : [];
  return { ...workspace, jobs };
}

export const readSubmission = (id: string, credential: string) =>
  rpc<Submission>('read_submission', { selected_link: id, credential });

export function submissionError(error: unknown) {
  const [status, message] = (() => {
    const code = error instanceof DatabaseError ? error.code : '';
    switch (code) {
      case '42501':
      case 'P0002':
        return [403, '링크가 만료되었거나 더 이상 사용할 수 없습니다. 운영진에게 문의해 주세요.'] as const;
      case '40001':
      case '23505':
        return [409, '다른 변경이 먼저 반영되었거나 이미 발급된 링크가 있습니다. 새로고침 후 확인해 주세요.'] as const;
      case '23503':
      case '23514':
      case '22023':
      case 'MEDIA_INVALID':
      case 'MEDIA_LIMIT':
        return [422, '입력값과 연결된 항목을 확인해 주세요.'] as const;
      default:
        return [503, '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'] as const;
    }
  })();
  return Response.json({ message }, { status, headers: submissionHeaders });
}
