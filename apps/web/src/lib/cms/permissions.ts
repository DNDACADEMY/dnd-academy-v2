import { auth, rpc } from './supabase';

export type Permission = 'admissions' | 'content';

export async function adminSession(writable = false) {
  if (!process.env.DND_SUPABASE_URL) return null;
  const client = await auth(writable);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  const permissions = await rpc<Permission[]>('cms_permissions', { actor: user.id });
  return { id: user.id, permissions };
}

export async function canAdmin(permission: Permission) {
  const session = await adminSession(true);
  return session?.permissions.includes(permission) ? session.id : null;
}
