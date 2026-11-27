import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import ClientProviders from '.';

vi.mock('next/navigation', () => ({ usePathname: vi.fn<typeof usePathname>() }));
vi.mock('@channel.io/channel-web-sdk-loader', () => ({
  loadScript: vi.fn<() => void>(),
  boot: vi.fn<() => void>(),
}));
vi.mock('react-perfect-scrollbar', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="custom-scrollbar">{children}</div>,
}));
vi.mock('@/utils', () => ({ isChristmasTheme: () => false }));

it.each(['/admin', '/submit-content/fixture'])('uses native document scroll on %s', (pathname) => {
  vi.mocked(usePathname).mockReturnValue(pathname);
  render(
    <ClientProviders>
      <p>콘텐츠</p>
    </ClientProviders>,
  );
  expect(screen.getByText('콘텐츠')).toBeVisible();
  expect(screen.queryByTestId('custom-scrollbar')).not.toBeInTheDocument();
});

it('keeps the public page scrollbar', () => {
  vi.mocked(usePathname).mockReturnValue('/organizers/1');
  render(
    <ClientProviders>
      <p>콘텐츠</p>
    </ClientProviders>,
  );
  expect(screen.getByTestId('custom-scrollbar')).toHaveTextContent('콘텐츠');
});
