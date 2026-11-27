import { contentAssets } from './content';
import type { ContentRecord } from './content-contract';
import type { mediaAssets, previewMedia } from './media';
import { approveSubmissions, inspectSubmission, processSubmissionPublication } from './submission-approval';
import { type Submission, organizerProfileFrom } from './submission-contract';
import { rpc } from './supabase';

vi.mock('./content', () => ({ contentAssets: vi.fn<typeof contentAssets>(() => []) }));
vi.mock('./media', () => ({
  mediaAssets: vi.fn<typeof mediaAssets>(async () => new Map()),
  previewMedia: vi.fn<typeof previewMedia>(async () => []),
}));
vi.mock('./supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./supabase')>()),
  rpc: vi.fn<typeof rpc>(),
}));

const actor = 'admin';
const base: ContentRecord = {
  id: 0,
  revisionId: 1,
  editNumber: 1,
  position: '개발',
  author: '',
  name: '운영진',
  description: '발급 당시 소개',
  links: [{ kind: 'email', url: 'mailto:private@example.com' }],
  mbti: 'ISTP',
  details: [
    { kind: 'now', body: '기존 이력' },
    { kind: 'role', body: '기존 업무' },
    { kind: 'recommendation', body: '기존 추천 이유' },
    { kind: 'share', body: 'https://example.com/profile' },
  ],
  skills: [],
  isArchived: false,
};

function review(
  input: Partial<Submission['input']>,
  current: ContentRecord = base,
  editor: ContentRecord | null = null,
) {
  const submission: Submission = {
    id: 'organizer-link',
    kind: 'organizer',
    label: '운영진 소개',
    teamId: null,
    memberId: null,
    targetId: base.id,
    expiresAt: '2026-12-20T00:00:00+09:00',
    state: 'submitted',
    version: 2,
    savedAt: null,
    cohort: null,
    teamNumber: null,
    publishedId: null,
    projectName: null,
    input: {
      name: base.name,
      description: base.description,
      links: [],
      position: base.position ?? null,
      cohort: null,
      projectId: null,
      organizerProfile: organizerProfileFrom(base),
      ...input,
    },
  };

  return { submission, base, current, editor, archived: false };
}

beforeEach(() => vi.clearAllMocks());

it('shows only effective publication changes and keeps unrelated edits to the live profile', async () => {
  const current = {
    ...base,
    revisionId: 2,
    description: '링크 발급 후 관리자가 게시한 소개',
  };
  const row = review({ name: '수정한 이름' }, current);
  vi.mocked(rpc).mockResolvedValueOnce([row]);

  const result = await inspectSubmission(actor, row.submission.id);

  expect(result.changes).toEqual([{ field: 'name', before: base.name, after: '수정한 이름' }]);
  expect(result.draft).toMatchObject({ name: '수정한 이름', description: current.description, links: [] });
});

it('requires renewed confirmation when the same field is edited again before approval', async () => {
  const current = { ...base, revisionId: 2, description: '관리자가 게시한 소개' };
  const row = review({ description: '링크에서 제출한 소개' }, current);
  const updated = { ...row, current: { ...current, revisionId: 3, description: '다시 변경한 소개' } };
  vi.mocked(rpc).mockResolvedValueOnce([row]).mockResolvedValueOnce([updated]).mockResolvedValueOnce([updated]);

  const first = await approveSubmissions(actor, [row.submission.id]);
  expect(first).toMatchObject({ conflicts: [{ id: row.submission.id, field: 'description' }] });
  const renewed = await approveSubmissions(actor, [row.submission.id], first.confirmation);
  expect(renewed.conflicts).toEqual(first.conflicts);
  expect(renewed.confirmation).not.toBe(first.confirmation);

  vi.mocked(rpc).mockResolvedValueOnce('job-id');
  await expect(approveSubmissions(actor, [row.submission.id], renewed.confirmation)).resolves.toEqual({
    jobId: 'job-id',
  });
  expect(rpc).toHaveBeenCalledTimes(4);
  expect(rpc).toHaveBeenLastCalledWith('queue_submission_publication', {
    actor,
    link_ids: [row.submission.id],
    fingerprint: renewed.confirmation,
  });
});

it('passes the previewed values to publication and preserves independent and conflicting draft edits', async () => {
  const editor: ContentRecord = {
    ...base,
    revisionId: 2,
    editNumber: 3,
    state: 'draft',
    description: '관리자 초안의 소개',
    details: base.details?.map((entry) => (entry.kind === 'role' ? { ...entry, body: '관리자 초안의 업무' } : entry)),
  };
  const row = review(
    { organizerProfile: { ...organizerProfileFrom(base), now: [], role: '제출한 업무' } },
    base,
    editor,
  );
  vi.mocked(rpc).mockResolvedValueOnce([row]).mockResolvedValueOnce([row]);
  const preview = await inspectSubmission(actor, row.submission.id);
  const { confirmation, conflicts } = await approveSubmissions(actor, [row.submission.id]);

  expect(preview.changes).toEqual([
    { field: 'now', before: ['기존 이력'], after: [] },
    { field: 'role', before: '기존 업무', after: '제출한 업무' },
  ]);
  expect(conflicts).toEqual([{ id: row.submission.id, field: 'role' }]);

  const published = [{ id: base.id, kind: 'organizer' }];
  vi.mocked(rpc)
    .mockResolvedValueOnce({
      id: 'job-id',
      state: 'processing',
      actor,
      fingerprint: confirmation,
      linkIds: [row.submission.id],
      assets: {},
    })
    .mockResolvedValueOnce([row])
    .mockResolvedValueOnce(published);

  await expect(processSubmissionPublication('job-id')).resolves.toEqual({ state: 'published', published });
  expect(rpc).toHaveBeenLastCalledWith('advance_submission_publication', {
    selected_job: 'job-id',
    worker: expect.any(String),
    items: [
      {
        kind: 'organizer',
        linkId: row.submission.id,
        expectedLive: base.revisionId,
        expectedRevision: editor.revisionId,
        expectedEdit: editor.editNumber,
        input: { ...preview.draft, links: base.links },
        restoreDraft: {
          ...preview.draft,
          links: base.links,
          description: editor.description,
          details: [
            { kind: 'role', body: '관리자 초안의 업무' },
            { kind: 'recommendation', body: '기존 추천 이유' },
            { kind: 'share', body: 'https://example.com/profile' },
          ],
        },
      },
    ],
  });
});
