import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { reserveAdminLogin } from '@/lib/cms/admin-login-limit';
import { auth, rpc } from '@/lib/cms/supabase';

import { signIn } from './actions';

const { signInWithPassword, signOut } = vi.hoisted(() => ({
  signInWithPassword:
    vi.fn<() => Promise<{ data: { user: { id: string } | null }; error: { status: number } | null }>>(),
  signOut: vi.fn<() => Promise<void>>(),
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn<typeof redirect>() }));
vi.mock('next/headers', () => ({ headers: vi.fn<typeof headers>() }));
vi.mock('@/lib/cms/admin-login-limit', () => ({ reserveAdminLogin: vi.fn<typeof reserveAdminLogin>() }));
vi.mock('@/lib/cms/supabase', () => ({
  auth: vi.fn<() => Promise<{ auth: { signInWithPassword: typeof signInWithPassword; signOut: typeof signOut } }>>(
    async () => ({ auth: { signInWithPassword, signOut } }),
  ),
  rpc: vi.fn<typeof rpc>(),
}));

function form() {
  const value = new FormData();
  value.set('email', ' Admin@example.com ');
  value.set('password', 'synthetic-password');
  return value;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(headers).mockResolvedValue(new Headers());
  vi.mocked(reserveAdminLogin).mockResolvedValue(true);
  signInWithPassword.mockResolvedValue({ data: { user: { id: 'fixture-user' } }, error: null });
});

it('only authenticates after a reservation and grants a session to an authorized admin', async () => {
  vi.mocked(rpc).mockResolvedValue(['content']);
  await signIn(form());
  expect(reserveAdminLogin).toHaveBeenCalledBefore(signInWithPassword);
  expect(signInWithPassword).toHaveBeenCalledWith({ email: 'Admin@example.com', password: 'synthetic-password' });
  expect(rpc).toHaveBeenCalledWith('cms_permissions', { actor: 'fixture-user' });
  expect(redirect).toHaveBeenCalledWith('/admin');
});

it('does not contact Auth when the shared quota is exhausted', async () => {
  vi.mocked(reserveAdminLogin).mockResolvedValue(false);
  await signIn(form());
  expect(auth).not.toHaveBeenCalled();
  expect(redirect).toHaveBeenCalledWith('/admin?login=limited');
});

it('fails closed when the counter is unavailable', async () => {
  vi.mocked(reserveAdminLogin).mockRejectedValue(new Error('database offline'));
  await signIn(form());
  expect(auth).not.toHaveBeenCalled();
  expect(redirect).toHaveBeenCalledWith('/admin?login=unavailable');
});

it('keeps upstream throttling separate from invalid credentials', async () => {
  signInWithPassword.mockResolvedValue({ data: { user: null }, error: { status: 429 } });
  await signIn(form());
  expect(rpc).not.toHaveBeenCalled();
  expect(redirect).toHaveBeenCalledWith('/admin?login=limited');
});

it('clears a session for an account without admin permissions', async () => {
  vi.mocked(rpc).mockResolvedValue([]);
  await signIn(form());
  expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(redirect).toHaveBeenCalledWith('/admin?login=failed');
});
