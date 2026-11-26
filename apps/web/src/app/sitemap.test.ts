afterEach(() => {
  vi.unstubAllEnvs();
});

it('publishes static routes and existing content IDs, including project zero', async () => {
  vi.stubEnv('DND_CMS_CONTENT', '');
  vi.stubEnv('NEXT_PUBLIC_ORIGIN', 'https://dnd.academy');
  vi.resetModules();

  const { default: sitemap } = await import('./sitemap');
  const urls = (await sitemap()).map(({ url }) => url);

  expect(urls).toEqual(
    expect.arrayContaining([
      'https://dnd.academy/projects',
      'https://dnd.academy/projects/0',
      'https://dnd.academy/organizers',
      'https://dnd.academy/organizers/2',
    ]),
  );
});
