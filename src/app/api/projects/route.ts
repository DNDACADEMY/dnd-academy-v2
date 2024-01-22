import { NextRequest, NextResponse } from 'next/server';

import { Project } from '@/lib/types/project';

import { getCacheDate } from '..';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const { searchParams } = new URL(request.url);

  const size = searchParams.get('size');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/data/project.json${getCacheDate()}`);

  if (!response.ok) {
    return NextResponse.json(null, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  const data = await response.json() as Project[];

  const projects = [...data].reverse().slice(0, size ? Number(size) : data.length);

  return NextResponse.json(projects, {
    status: response.status,
    statusText: response.statusText,
    headers: requestHeaders,
  });
}
