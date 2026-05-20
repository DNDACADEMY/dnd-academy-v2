const ORIGINAL_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN;

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

    expect(DEFAULT_METADATA.metadataBase?.origin).toBe('http://localhost:3000');
    expect(DEFAULT_METADATA.openGraph?.url).toBe('http://localhost:3000');
    expect(JSON.stringify(DEFAULT_METADATA)).not.toContain('undefined');
  });

  it('normalizes configured origins before exposing metadata URLs', async () => {
    process.env.NEXT_PUBLIC_ORIGIN = 'https://dnd.academy/some/path';

    const { DEFAULT_METADATA } = await loadMetadataModule();

    expect(DEFAULT_METADATA.metadataBase?.origin).toBe('https://dnd.academy');
    expect(DEFAULT_METADATA.openGraph?.url).toBe('https://dnd.academy');
  });
});
