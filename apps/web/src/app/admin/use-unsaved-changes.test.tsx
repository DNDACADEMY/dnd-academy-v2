import { fireEvent, render, screen } from '@testing-library/react';

import { useUnsavedChanges } from './use-unsaved-changes';

function Editor({ dirty }: { dirty: boolean }) {
  useUnsavedChanges(dirty);
  return <a href="#other-panel">프로젝트 관리</a>;
}

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

it('keeps the editor open when the user cancels navigation', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<Editor dirty />);
  const link = screen.getByRole('link', { name: '프로젝트 관리' });
  expect(fireEvent.click(link)).toBe(false);
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(fireEvent(window, new Event('beforeunload', { cancelable: true }))).toBe(false);
});

it('lets the user navigate or refresh after saving', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  const { rerender } = render(<Editor dirty />);
  rerender(<Editor dirty={false} />);
  expect(fireEvent.click(screen.getByRole('link', { name: '프로젝트 관리' }))).toBe(true);
  expect(fireEvent(window, new Event('beforeunload', { cancelable: true }))).toBe(true);
  expect(confirm).not.toHaveBeenCalled();
});
