import { type ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import ResponsiveMasonry from './index';

jest.mock('react-responsive-masonry', () => ({
  __esModule: true,
  default: ({ children, className, gutter }: { children: ReactNode; className?: string; gutter: string }) => (
    <div data-testid="masonry" data-gutter={gutter} className={className}>
      {children}
    </div>
  ),
  ResponsiveMasonry: ({
    children,
    columnsCountBreakPoints,
  }: {
    children: ReactNode;
    columnsCountBreakPoints: Record<number, number>;
  }) => (
    <section data-testid="responsive-masonry" data-breakpoints={JSON.stringify(columnsCountBreakPoints)}>
      {children}
    </section>
  ),
}));

describe('ResponsiveMasonry', () => {
  it('keeps the existing responsive breakpoints and gutter contract', () => {
    render(
      <ResponsiveMasonry className="custom-class">
        <article>Project card</article>
      </ResponsiveMasonry>,
    );

    expect(screen.getByText('Project card')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-masonry')).toHaveAttribute(
      'data-breakpoints',
      JSON.stringify({ 350: 1, 720: 2, 900: 3 }),
    );
    expect(screen.getByTestId('masonry')).toHaveAttribute('data-gutter', '24px');
    expect(screen.getByTestId('masonry')).toHaveClass('custom-class');
  });
});
