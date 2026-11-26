import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { sessionCookieOptions } from '@/lib/cms/supabase';

export async function proxy(request: NextRequest) {
  const url = process.env.DND_SUPABASE_URL;
  const key = process.env.DND_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  if (url && key && request.cookies.getAll().some(({ name }) => name.startsWith(sessionCookieOptions.name))) {
    const client = createServerClient(url, key, {
      cookieOptions: sessionCookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          for (const { name, value } of cookies) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
        },
      },
    });
    await client.auth.getClaims();
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: '/admin/:path*' };
