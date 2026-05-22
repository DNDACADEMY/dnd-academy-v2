import { NextResponse } from 'next/server';
import type { NextAuthRequest } from 'next-auth';

import { auth } from '@/auth';
import { isEmailAllowed } from '@/utils';

const proxy = auth((req: NextAuthRequest) => {
  if (req.nextUrl.pathname === '/login' || process.env.NODE_ENV === 'development') {
    return NextResponse.next({
      request: req,
    });
  }

  if (!req.auth?.user?.email) {
    const newUrl = new URL('/login', req.nextUrl.origin);

    return NextResponse.redirect(newUrl);
  }

  if (isEmailAllowed(req.auth.user.email)) {
    return NextResponse.next({
      request: req,
    });
  }

  const newUrl = new URL('/login?error=unauthorized_email', req.nextUrl.origin);

  return NextResponse.redirect(newUrl);
});

export default proxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
