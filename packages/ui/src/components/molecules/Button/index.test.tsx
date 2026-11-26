import { render, screen } from '@testing-library/react';

import Button from '.';

it('renders the correct interactive element for actions and navigation', () => {
  render(
    <>
      <Button>저장</Button>
      <Button href="/dnd/about">소개</Button>
    </>,
  );

  expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '소개' })).toHaveAttribute('href', '/dnd/about');
});
