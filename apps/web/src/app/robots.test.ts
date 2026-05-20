import type { MetadataRoute } from 'next';

const ORIGINAL_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN;

const loadRobotsModule = async () => {
  jest.resetModules();
  return import('./robots');
};

afterEach(() => {
  if (ORIGINAL_ORIGIN) {
    process.env.NEXT_PUBLIC_ORIGIN = ORIGINAL_ORIGIN;
    return;
  }

  delete process.env.NEXT_PUBLIC_ORIGIN;
});

describe('robots metadata route', () => {
  it('uses the fallback origin when NEXT_PUBLIC_ORIGIN is missing', async () => {
    delete process.env.NEXT_PUBLIC_ORIGIN;

    const { default: robots } = await loadRobotsModule();
    const result: MetadataRoute.Robots = robots();

    expect(result.sitemap).toBe('http://localhost:3000/sitemap.xml');
    expect(JSON.stringify(result)).not.toContain('undefined');
  });

  it('normalizes the configured origin for sitemap URLs', async () => {
    process.env.NEXT_PUBLIC_ORIGIN = 'https://dnd.academy/some/path';

    const { default: robots } = await loadRobotsModule();

    expect(robots().sitemap).toBe('https://dnd.academy/sitemap.xml');
  });
});
