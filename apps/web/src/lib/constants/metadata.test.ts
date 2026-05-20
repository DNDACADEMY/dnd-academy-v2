import type { Metadata } from 'next';

const ORIGINAL_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN;

const expectMetadataBaseOrigin = (metadataBase: Metadata['metadataBase'], origin: string) => {
  expect(metadataBase).toBeInstanceOf(URL);
  expect((metadataBase as URL).origin).toBe(origin);
};

const loadMetadataModule = async () => {
  jest.resetModules();
  return import('./metadata');
};

afterEach(() => {
  if (ORIGINAL_ORIGIN) {
    process.env.NEXT_PUBLIC_ORIGIN = ORIGINAL_ORIGIN;
    return;
  }

  delete process.env.NEXT_PUBLIC_ORIGIN;
});

describe('metadata defaults', () => {
  it('uses the fallback origin when NEXT_PUBLIC_ORIGIN is missing', async () => {
    delete process.env.NEXT_PUBLIC_ORIGIN;

    const { DEFAULT_METADATA } = await loadMetadataModule();

    expectMetadataBaseOrigin(DEFAULT_METADATA.metadataBase, 'http://localhost:3000');
    expect(DEFAULT_METADATA.openGraph?.url).toBe('http://localhost:3000');
    expect(JSON.stringify(DEFAULT_METADATA)).not.toContain('undefined');
  });

  it('normalizes configured origins before exposing metadata URLs', async () => {
    process.env.NEXT_PUBLIC_ORIGIN = 'https://dnd.academy/some/path';

    const { DEFAULT_METADATA } = await loadMetadataModule();

    expectMetadataBaseOrigin(DEFAULT_METADATA.metadataBase, 'https://dnd.academy');
    expect(DEFAULT_METADATA.openGraph?.url).toBe('https://dnd.academy');
  });
});
