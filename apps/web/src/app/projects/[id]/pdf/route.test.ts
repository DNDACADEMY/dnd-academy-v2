import { getProject } from '@/lib/apis/project';

import { GET } from './route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('streams the requested bytes from the published PDF without forwarding preview credentials', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  const fetchPdf = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('%PDF', { status: 206, headers: { 'Content-Range': 'bytes 0-3/100' } }));
  vi.stubGlobal('fetch', fetchPdf);

  const request = new Request('https://example.test/projects/106/pdf', {
    headers: { Range: 'bytes=0-3', Cookie: 'preview=test' },
  });
  const response = await GET(request, { params: Promise.resolve({ id: '106' }) });

  const [[url, options]] = fetchPdf.mock.calls;
  expect(url).toBe(getProject({ id: 106 })?.pdf);
  expect([...new Headers(options?.headers)]).toEqual([['range', 'bytes=0-3']]);
  expect(response.status).toBe(206);
  expect(response.headers.get('Content-Range')).toBe('bytes 0-3/100');
  expect(await response.text()).toBe('%PDF');
});

it.each([
  ['preview', 'missing'],
  ['production', '106'],
])('returns 404 without contacting storage in %s for project %s', async (environment, id) => {
  vi.stubEnv('VERCEL_ENV', environment);
  const fetchPdf = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchPdf);

  const response = await GET(new Request('https://example.test'), { params: Promise.resolve({ id }) });

  expect(response.status).toBe(404);
  expect(fetchPdf).not.toHaveBeenCalled();
});
