const ORIGINAL_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN;

const loadSitemapModule = async () => {
  jest.resetModules();
  return import('./sitemap');
};

afterEach(() => {
  if (ORIGINAL_ORIGIN) {
    process.env.NEXT_PUBLIC_ORIGIN = ORIGINAL_ORIGIN;
    return;
  }

  delete process.env.NEXT_PUBLIC_ORIGIN;
});

describe('sitemap metadata route', () => {
  it('uses the fallback origin when NEXT_PUBLIC_ORIGIN is missing', async () => {
    delete process.env.NEXT_PUBLIC_ORIGIN;

    const { default: sitemap } = await loadSitemapModule();
    const urls = sitemap().map(({ url }) => url);

    expect(urls).toContain('http://localhost:3000');
    expect(urls).toContain('http://localhost:3000/projects');
    expect(urls).toContain('http://localhost:3000/organizers');
    expect(urls.some((url) => url.includes('undefined'))).toBe(false);
  });

  it('normalizes configured origins for static and generated entries', async () => {
    process.env.NEXT_PUBLIC_ORIGIN = 'https://dnd.academy/some/path';

    const { default: sitemap } = await loadSitemapModule();
    const urls = sitemap().map(({ url }) => url);

    expect(urls.length).toBeGreaterThan(10);
    expect(urls).toContain('https://dnd.academy/projects');
    expect(urls).toContain('https://dnd.academy/organizers');
    expect(urls.every((url) => url.startsWith('https://dnd.academy'))).toBe(true);
  });
});
