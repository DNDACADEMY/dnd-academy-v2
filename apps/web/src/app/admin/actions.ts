'use server';

import { redirect } from 'next/navigation';

import { auth, rpc } from '@/lib/cms/supabase';

export async function signIn(form: FormData) {
  let authenticated = false;
  const email = form.get('email');
  const password = form.get('password');
  if (typeof email === 'string' && typeof password === 'string' && email.length <= 254 && password.length <= 512) {
    try {
      const client = await auth(true);
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        const permissions = await rpc<string[]>('cms_permissions', { actor: data.user.id });
        authenticated = permissions.length > 0;
        if (!authenticated) await client.auth.signOut({ scope: 'local' });
      }
    } catch {
      authenticated = false;
    }
  }
  redirect(authenticated ? '/admin' : '/admin?login=failed');
}

export async function signOut() {
  await (await auth(true)).auth.signOut({ scope: 'local' });
  redirect('/admin');
}
