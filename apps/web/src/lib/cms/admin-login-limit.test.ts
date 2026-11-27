import { reserveAdminLogin } from './admin-login-limit';
import { rpc } from './supabase';

vi.mock('./supabase', () => ({ rpc: vi.fn<typeof rpc>() }));

const request = (ip: string) => new Headers({ 'x-vercel-forwarded-for': ip, 'x-forwarded-for': '198.51.100.1' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('DND_SUPABASE_SERVICE_KEY', 'synthetic-key');
  vi.mocked(rpc).mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());

it('groups IPv6 addresses by network and account aliases by case without sending plaintext', async () => {
  await reserveAdminLogin('Admin@example.com', request('2001:db8:abcd:1::1'));
  await reserveAdminLogin('admin@example.com', request('2001:0db8:abcd:0001:abcd::999'));
  await reserveAdminLogin('admin@example.com', request('2001:db8:abcd:2::1'));
  const [first, sameNetwork, otherNetwork] = vi.mocked(rpc).mock.calls.map(([, args]) => args);
  expect(first).toEqual(sameNetwork);
  expect(first?.network_digest).toMatch(/^[a-f0-9]{64}$/);
  expect(first?.pair_digest).toMatch(/^[a-f0-9]{64}$/);
  expect(first?.account_digest).toMatch(/^[a-f0-9]{64}$/);
  expect(otherNetwork?.network_digest).not.toEqual(first?.network_digest);
  expect(otherNetwork?.pair_digest).not.toEqual(first?.pair_digest);
  expect(otherNetwork?.account_digest).toEqual(first?.account_digest);
});

it('treats IPv4-mapped IPv6 as the same client network as IPv4', async () => {
  await reserveAdminLogin('admin@example.com', request('198.51.100.1'));
  await reserveAdminLogin('admin@example.com', request('::ffff:198.51.100.1'));
  expect(vi.mocked(rpc).mock.calls[0]).toEqual(vi.mocked(rpc).mock.calls[1]);
});

it('uses only the account limiter when no trusted single address is available', async () => {
  await reserveAdminLogin('admin@example.com', request('198.51.100.1, 198.51.100.2'));
  vi.stubEnv('VERCEL', '');
  await reserveAdminLogin('admin@example.com', request('198.51.100.1'));
  expect(vi.mocked(rpc).mock.calls[0]).toEqual(vi.mocked(rpc).mock.calls[1]);
  expect(rpc).toHaveBeenCalledWith('reserve_admin_login', {
    network_digest: null,
    pair_digest: null,
    account_digest: expect.stringMatching(/^[a-f0-9]{64}$/),
  });
});
