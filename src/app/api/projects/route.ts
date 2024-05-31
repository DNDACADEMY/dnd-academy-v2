import { NextRequest, NextResponse } from 'next/server';

import { getProjects } from '@/lib/apis/project';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const { searchParams } = new URL(request.url);

  const size = searchParams.get('size');

  const data = getProjects();

  const projects = data.slice(0, size ? Number(size) : data.length);

  return NextResponse.json(projects, {
    status: 200,
    headers: {
      ...requestHeaders,
      'Cache-Control': 'public, s-maxage=1',
      'CDN-Cache-Control': 'public, s-maxage=60',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
    },
  });
}
