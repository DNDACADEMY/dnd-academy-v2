import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SubmissionLink, SubmissionWorkspace } from '@/lib/cms/submission-contract';

import { adminRequest } from './admin-request';
import SubmissionsPanel from './submissions-panel';

const router = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>(), refresh: vi.fn<() => void>() }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock('./admin-request');
vi.mock('@/components/pages/SubmissionPreview', () => ({ default: () => null }));

const submitted: SubmissionLink = {
  id: 'review-1',
  kind: 'review',
  label: '후기 작성자',
  teamId: 'team-1',
  memberId: 'member-1',
  targetId: null,
  expiresAt: '2030-01-01T00:00:00+09:00',
  state: 'submitted',
  version: 1,
  savedAt: null,
  cohort: 16,
  teamNumber: 1,
  publishedId: null,
};

function workspace(): SubmissionWorkspace {
  return {
    cohortId: 1,
    cohorts: [
      { id: 1, ordinal: 16 },
      { id: 2, ordinal: 15 },
    ],
    teams: [
      {
        id: 'team-1',
        number: 1,
        projectId: null,
        members: [{ id: 'member-1', name: '후기 작성자', position: '프론트엔드 개발자' }],
      },
      { id: 'team-2', number: 2, projectId: 0, members: [] },
      { id: 'team-3', number: 3, projectId: 1, members: [] },
    ],
    links: [submitted],
    jobs: [],
  };
}

function setView(view?: string) {
  window.history.replaceState(null, '', '/admin?section=submissions' + (view ? '&view=' + view : ''));
}

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');

describe('submission workspace', () => {
  afterEach(() => {
    if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  });
  beforeEach(() => {
    vi.clearAllMocks();
    setView();
  });

  it('explains why reviews are waiting and removes already processing submissions from the approval list', () => {
    const data = workspace();
    const { rerender } = render(<SubmissionsPanel workspace={data} />);
    expect(screen.getByText('프로젝트가 제출되면 후기를 함께 게시할 수 있습니다.')).toBeVisible();
    expect(screen.queryByRole('button', { name: /승인 및 게시/ })).not.toBeInTheDocument();
    rerender(
      <SubmissionsPanel
        workspace={{ ...data, jobs: [{ id: 'job-1', linkIds: [submitted.id], state: 'processing' }] }}
      />,
    );
    expect(screen.getByText('게시 중')).toBeVisible();
    expect(adminRequest).toHaveBeenCalledWith(
      'submissions',
      { action: 'publicationStatus', jobId: 'job-1' },
      expect.any(AbortSignal),
    );
    expect(screen.queryByRole('button', { name: '게시 요청 다시 보내기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '제출안 검토' })).not.toBeInTheDocument();
  });

  it('keeps the team view across cohort selection and blocks issuing to the wrong connected project', () => {
    setView('teams');
    render(<SubmissionsPanel workspace={workspace()} target={{ id: 0, name: '기존 프로젝트', kind: 'project' }} />);
    expect(screen.getByRole('heading', { name: '2조 작성 링크 발급' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /3조/ }));
    expect(screen.getByRole('button', { name: '링크 발급' })).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox', { name: '기수' }), { target: { value: '15' } });
    expect(router.push).toHaveBeenCalledWith('/admin?section=submissions&view=teams&cohort=15');
  });

  it('extends an existing link with a separate deadline scoped to the chosen link', async () => {
    setView('teams');
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    });
    vi.mocked(adminRequest).mockResolvedValue({ changed: 1 });
    const data = workspace();
    data.links = [{ ...submitted, state: 'issued' }];
    render(<SubmissionsPanel workspace={data} />);
    fireEvent.change(screen.getByLabelText('마감 시각 (한국시간)'), { target: { value: '2030-02-01T12:00' } });
    fireEvent.click(screen.getByRole('button', { name: '연장' }));
    const dialog = screen.getByRole('dialog', { name: '링크 기한 연장' });
    fireEvent.change(within(dialog).getByLabelText('새 마감 시각 (한국시간)'), {
      target: { value: '2030-01-04T15:30' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: '기한 연장' }));
    await screen.findByText('1건의 링크 기한을 연장했습니다.');
    expect(adminRequest).toHaveBeenCalledExactlyOnceWith('submissions', {
      action: 'extend',
      scope: 'link',
      id: submitted.id,
      expiresAt: '2030-01-04T15:30:00+09:00',
    });
    expect(screen.getByLabelText('마감 시각 (한국시간)')).toHaveValue('2030-02-01T12:00');
  });
});
