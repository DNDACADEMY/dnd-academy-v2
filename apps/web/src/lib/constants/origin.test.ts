import type { getPublicOrigin as getPublicOriginType } from './origin';

type OriginModule = {
  PUBLIC_ORIGIN: string;
  getPublicOrigin: typeof getPublicOriginType;
};

const ORIGINAL_ORIGIN = process.env.NEXT_PUBLIC_ORIGIN;

const loadOriginModule = async (): Promise<OriginModule> => {
  jest.resetModules();
  return import('./origin');
};

afterEach(() => {
  if (ORIGINAL_ORIGIN) {
    process.env.NEXT_PUBLIC_ORIGIN = ORIGINAL_ORIGIN;
    return;
  }

  delete process.env.NEXT_PUBLIC_ORIGIN;
});

describe('getPublicOrigin', () => {
  it('normalizes configured origins to the protocol and host', async () => {
    process.env.NEXT_PUBLIC_ORIGIN = 'https://dnd.academy/some/path?query=1';

    const { PUBLIC_ORIGIN, getPublicOrigin } = await loadOriginModule();

    expect(PUBLIC_ORIGIN).toBe('https://dnd.academy');
    expect(getPublicOrigin()).toBe('https://dnd.academy');
  });

  it('falls back to localhost when NEXT_PUBLIC_ORIGIN is missing', async () => {
    delete process.env.NEXT_PUBLIC_ORIGIN;

    const { PUBLIC_ORIGIN, getPublicOrigin } = await loadOriginModule();

    expect(PUBLIC_ORIGIN).toBe('http://localhost:3000');
    expect(getPublicOrigin()).toBe('http://localhost:3000');
  });

  it('falls back to localhost when NEXT_PUBLIC_ORIGIN is malformed', async () => {
    process.env.NEXT_PUBLIC_ORIGIN = 'not a url';

    const { PUBLIC_ORIGIN, getPublicOrigin } = await loadOriginModule();

    expect(PUBLIC_ORIGIN).toBe('http://localhost:3000');
    expect(getPublicOrigin()).toBe('http://localhost:3000');
  });
});
