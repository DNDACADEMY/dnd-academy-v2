import { NextRequest, NextResponse } from 'next/server';

import { getProjects } from '@/lib/apis/project';

import { FetchError } from '..';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const { searchParams } = new URL(request.url);

  const size = searchParams.get('size');

  try {
    const data = await getProjects();

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
  } catch (error) {
    const fetchError = error as FetchError;

    const errorResponse = fetchError.response;

    return NextResponse.json(null, {
      status: errorResponse?.status,
      statusText: errorResponse?.statusText,
      headers: errorResponse?.headers,
    });
  }
}
