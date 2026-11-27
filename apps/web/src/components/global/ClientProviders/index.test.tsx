import { render, screen } from '@testing-library/react';

import ClientProviders from '.';

vi.mock('@channel.io/channel-web-sdk-loader', () => ({
  loadScript: vi.fn<() => void>(),
  boot: vi.fn<() => void>(),
}));
vi.mock('@/utils', () => ({ isChristmasTheme: () => false }));

it('leaves page content in the native document flow', () => {
  const { container } = render(
    <ClientProviders>
      <main>콘텐츠</main>
    </ClientProviders>,
  );
  expect(container.firstElementChild).toBe(screen.getByRole('main'));
});
