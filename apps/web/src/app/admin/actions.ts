'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { reserveAdminLogin } from '@/lib/cms/admin-login-limit';
import { auth, rpc } from '@/lib/cms/supabase';

export async function signIn(form: FormData) {
  const rawEmail = form.get('email');
  const password = form.get('password');
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  let outcome = 'failed';

  if (email && email.length <= 254 && typeof password === 'string' && password && password.length <= 512) {
    try {
      if (!(await reserveAdminLogin(email, await headers()))) {
        outcome = 'limited';
      } else {
        outcome = await authenticateAdmin(email, password);
      }
    } catch {
      outcome = 'unavailable';
    }
  }
  redirect(outcome === 'success' ? '/admin' : `/admin?login=${outcome}`);
}

async function authenticateAdmin(email: string, password: string) {
  const client = await auth(true);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error?.status === 429) return 'limited';
  if (error || !data.user) return 'failed';

  let allowed = false;
  try {
    const permissions = await rpc<string[]>('cms_permissions', { actor: data.user.id });
    allowed = permissions.length > 0;
    return allowed ? 'success' : 'failed';
  } finally {
    if (!allowed) await client.auth.signOut({ scope: 'local' });
  }
}

export async function signOut() {
  await (await auth(true)).auth.signOut({ scope: 'local' });
  redirect('/admin');
}
