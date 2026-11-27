import { canAdmin } from '@/lib/cms/permissions';
import { approveSubmissions, inspectSubmission } from '@/lib/cms/submission-approval';
import { grantRequest, type SubmissionPublication } from '@/lib/cms/submission-contract';
import { dispatchSubmissionPublication } from '@/lib/cms/submission-publication-dispatch';
import {
  lookupSubmissionContent,
  submissionError,
  submissionHeaders,
  submissionsEnabled,
  submissionToken,
  tokenHash,
} from '@/lib/cms/submissions';
import { rpc } from '@/lib/cms/supabase';

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!submissionsEnabled()) return new Response(null, { status: 404, headers: submissionHeaders });
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return Response.json({ message: '요청 출처를 확인해 주세요.' }, { status: 403, headers: submissionHeaders });
  }
  try {
    const actor = await canAdmin('content');
    if (!actor)
      return Response.json({ message: '콘텐츠 담당 권한이 필요합니다.' }, { status: 403, headers: submissionHeaders });
    const parsed = grantRequest.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return Response.json({ message: '입력값을 확인해 주세요.' }, { status: 422, headers: submissionHeaders });
    if (parsed.data.action === 'inspect') {
      return Response.json(await inspectSubmission(actor, parsed.data.linkId), { headers: submissionHeaders });
    }
    if (parsed.data.action === 'reject') {
      await rpc('reject_submission', { actor, selected_link: parsed.data.linkId });
      return Response.json({ rejected: true }, { headers: submissionHeaders });
    }
    if (parsed.data.action === 'publicationStatus' || parsed.data.action === 'dispatchPublication') {
      const jobId = parsed.data.jobId;
      const job = await rpc<SubmissionPublication | null>('read_submission_publication', {
        actor,
        selected_job: jobId,
      });
      if (parsed.data.action === 'dispatchPublication' && (job?.state === 'queued' || job?.state === 'processing')) {
        await dispatchSubmissionPublication(jobId);
      }
      return Response.json(job, { headers: submissionHeaders });
    }
    if (parsed.data.action === 'approve') {
      const approval = await approveSubmissions(actor, parsed.data.linkIds, parsed.data.acceptConflicts);
      if (approval.jobId) await dispatchSubmissionPublication(approval.jobId);
      return Response.json(approval, { headers: submissionHeaders, status: approval.jobId ? 202 : 200 });
    }
    if (parsed.data.action === 'lookup') {
      return Response.json(await lookupSubmissionContent(actor, parsed.data), { headers: submissionHeaders });
    }
    const { action, ...input } = parsed.data;
    const token = action === 'issue' ? submissionToken() : null;
    const result = await rpc<{ id?: string }>('admin_submission_action', {
      actor,
      operation: action,
      input: token ? { ...input, tokenHash: tokenHash(token) } : input,
    });
    return Response.json(token ? { ...result, path: '/submit-content/' + result.id + '#' + token } : result, {
      headers: submissionHeaders,
    });
  } catch (error) {
    return submissionError(error);
  }
}
