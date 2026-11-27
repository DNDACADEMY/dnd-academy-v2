import { act, fireEvent, render, screen } from '@testing-library/react';

import type { SubmissionContentMatch } from '@/lib/cms/submission-contract';

import { adminRequest } from './admin-request';
import SubmissionContentPicker from './submission-content-picker';

vi.mock('./admin-request');

it('ignores a delayed search response after the query changes and selects ID zero from the current results', async () => {
  const stale = Promise.withResolvers<SubmissionContentMatch[]>();
  const match = { id: 0, name: '현재 프로젝트', cohort: 16 };
  vi.mocked(adminRequest).mockResolvedValueOnce(stale.promise).mockResolvedValueOnce([match]);
  const onSelect = vi.fn<(item: SubmissionContentMatch | null) => void>();

  render(<SubmissionContentPicker kind="project" cohort={16} selected={null} onSelect={onSelect} disabled={false} />);
  const input = screen.getByRole('textbox', { name: '기존 프로젝트 검색' });
  fireEvent.change(input, { target: { value: '이전' } });
  fireEvent.click(screen.getByRole('button', { name: '검색' }));
  const oldSignal = vi.mocked(adminRequest).mock.calls[0]?.[2];

  fireEvent.change(input, { target: { value: '현재' } });
  expect(oldSignal?.aborted).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: '검색' }));
  await screen.findByRole('option', { name: match.name });

  await act(async () => stale.resolve([{ id: 1, name: '이전 프로젝트' }]));
  expect(screen.queryByRole('option', { name: '이전 프로젝트' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: '검색 결과' }), { target: { value: '0' } });
  expect(onSelect).toHaveBeenCalledWith(match);
});
