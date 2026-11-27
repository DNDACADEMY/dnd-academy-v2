import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import type { ContentSummary } from '@/lib/cms/content-contract';

import { adminRequest } from './admin-request';
import ContentPanel from './content-panel';

const router = vi.hoisted(() => ({ replace: vi.fn<(href: string) => void>(), refresh: vi.fn<() => void>() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('./admin-request');

const rows: ContentSummary[] = [
  { id: 0, name: '현 멤버', state: 'published', isArchived: false },
  { id: 1, name: '전 멤버', state: 'published', isArchived: true },
  { id: 2, name: '작성 중 멤버', state: 'draft', isArchived: true },
];

it('combines organizer activity, publication status and search', () => {
  render(<ContentPanel kind="organizer" rows={rows} create={false} submissionLinks={false} />);
  const list = within(screen.getByRole('region', { name: '운영진 목록' }));
  const activity = list.getByRole('combobox', { name: '활동 상태 필터' });
  const publication = list.getByRole('combobox', { name: '게시 상태 필터' });

  fireEvent.change(activity, { target: { value: 'former' } });
  expect(list.queryByText('현 멤버')).not.toBeInTheDocument();
  expect(list.getByText('전 멤버')).toBeVisible();
  expect(list.getByText('작성 중 멤버')).toBeVisible();

  fireEvent.change(publication, { target: { value: 'published' } });
  expect(list.getByText('전 멤버')).toBeVisible();
  expect(list.queryByText('작성 중 멤버')).not.toBeInTheDocument();

  fireEvent.change(list.getByRole('searchbox'), { target: { value: '현 멤버' } });
  expect(list.getByText('검색 조건에 맞는 항목이 없습니다.')).toBeVisible();

  fireEvent.change(activity, { target: { value: 'active' } });
  expect(list.getByText('현 멤버')).toBeVisible();
});

it('shows the activity filter only in the organizer library', () => {
  render(<ContentPanel kind="project" rows={[]} create={false} submissionLinks={false} />);
  expect(screen.queryByRole('combobox', { name: '활동 상태 필터' })).not.toBeInTheDocument();
});

it('confirms an organizer deletion and submits the current revision', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  vi.mocked(adminRequest).mockResolvedValue({ id: 0 });
  try {
    render(
      <ContentPanel
        kind="organizer"
        rows={rows}
        create={false}
        submissionLinks={false}
        initial={{
          id: 0,
          name: '현 멤버',
          description: '',
          links: [],
          position: '개발',
          state: 'draft',
          revisionId: 21,
          editNumber: 2,
          liveRevisionId: 20,
          liveEditNumber: 1,
        }}
      />,
    );
    const button = screen.getByRole('button', { name: '프로필 삭제' });
    fireEvent.click(button);
    expect(adminRequest).not.toHaveBeenCalled();

    fireEvent.click(button);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin?section=content&kind=organizer'));
    expect(adminRequest).toHaveBeenCalledWith('content', {
      action: 'delete',
      kind: 'organizer',
      id: 0,
      revisionId: 21,
      editNumber: 2,
    });
  } finally {
    confirm.mockRestore();
  }
});
