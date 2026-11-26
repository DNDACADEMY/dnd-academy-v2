import { randomBytes } from 'node:crypto';

import { encryptIdentity } from './identity';
import { checkApplicant, currentEvent, options } from './public-admissions';
import { rpc } from './supabase';

vi.mock('./supabase', () => ({ rpc: vi.fn<typeof rpc>() }));

const origin = 'https://passboard.example.com';
const validIdentity = { name: '가상 지원자', email: 'fake@example.com' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('DND_PASSBOARD_ORIGINS', origin);
  vi.stubEnv('DND_APP_ENCRYPTION_KEY', randomBytes(32).toString('base64'));
  vi.stubEnv('DND_APP_SEARCH_KEY', randomBytes(32).toString('base64'));
});
afterEach(() => vi.unstubAllEnvs());

function post(body: object) {
  return new Request('https://web.example.com/event/7/applicant/status/check', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

it('keeps missing schedules separate from backend outages', async () => {
  vi.mocked(rpc).mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('backend unavailable'));
  const request = new Request('https://web.example.com/events/current');
  const missing = await currentEvent(request);
  expect(missing.status).toBe(404);
  expect(await missing.json()).toMatchObject({ code: 'EV001' });
  expect((await currentEvent(request)).status).toBe(503);
});

it('returns the Spring-shaped errors without echoing identity', async () => {
  vi.mocked(rpc).mockResolvedValueOnce({ code: 'AP002' });
  const response = await checkApplicant(post(validIdentity), '7');
  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({
    code: 'AP002',
    status: 422,
    message: '합격자 조회 가능 기간이 아닙니다',
    errors: [],
  });
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(response.headers.get('access-control-allow-origin')).toBe(origin);
  expect(vi.mocked(rpc).mock.calls[0][1]).not.toMatchObject(validIdentity);
});

it.each(['NONE', 'PASSED', 'FAILED', 'WAITLISTED'])('returns only public contract fields for %s', async (status) => {
  vi.mocked(rpc).mockResolvedValue({
    eventName: '가상 발표',
    nameCiphertext: encryptIdentity('name', validIdentity.name),
    status,
  });
  const response = await checkApplicant(post(validIdentity), '7');
  expect(await response.json()).toEqual({ eventName: '가상 발표', name: validIdentity.name, status });
});

it('rejects malformed input before querying the database and only permits configured CORS origins', async () => {
  expect((await checkApplicant(post({ ...validIdentity, email: 'bad-email' }), '7')).status).toBe(422);
  expect(rpc).not.toHaveBeenCalled();
  expect(options(post(validIdentity)).status).toBe(204);
  expect(
    options(new Request('https://web.example.com', { headers: { Origin: 'https://unknown.example.com' } })).status,
  ).toBe(403);
});
