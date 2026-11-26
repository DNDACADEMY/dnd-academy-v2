import { fireEvent, render, screen } from '@testing-library/react';

import Tag from '.';

it('passes filter selection to the caller', () => {
  const onClick = vi.fn<() => void>();
  render(<Tag onClick={onClick} title="개발" isActive={false} count={2} size="small" />);

  fireEvent.click(screen.getByText('개발'));
  expect(onClick).toHaveBeenCalledOnce();
});
