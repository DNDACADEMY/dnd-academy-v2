import { NextRequest, NextResponse } from 'next/server';

import { getCacheDate } from '..';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/data/project.json${getCacheDate()}`);

  if (!response.ok) {
    return NextResponse.json(null, {
      status: response.status,
      statusText: response.statusText,
    });
  }

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
    statusText: response.statusText,
    headers: requestHeaders,
  });
}
