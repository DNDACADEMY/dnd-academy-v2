import { NextResponse } from 'next/server';

import { auth as middleware } from '@/auth';
import { isEmailAllowed } from '@/utils';

export default middleware((req: any) => {
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

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
