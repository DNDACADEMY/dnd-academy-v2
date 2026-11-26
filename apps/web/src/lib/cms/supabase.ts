import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const sessionCookieOptions = {
  name: 'dnd-cms-session',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export function supabaseUrl() {
  const url = process.env.DND_SUPABASE_URL;
  if (!url) throw new Error('DND_SUPABASE_URL is required');
  return url;
}

export function database() {
  const key = process.env.DND_SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('DND_SUPABASE_SERVICE_KEY is required');
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

export async function auth(writable = false) {
  const key = process.env.DND_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error('DND_SUPABASE_PUBLISHABLE_KEY is required');
  const jar = await cookies();
  return createServerClient(supabaseUrl(), key, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        if (writable) for (const { name, value, options } of values) jar.set(name, value, options);
      },
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await database().rpc(name, args);
  if (error) throw new DatabaseError(error.code);
  return data as T;
}

export class DatabaseError extends Error {
  constructor(readonly code: string) {
    super('Database request failed');
  }
}
