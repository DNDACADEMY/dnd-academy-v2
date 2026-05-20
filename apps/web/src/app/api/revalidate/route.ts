import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const secret = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;
  const paths = request.nextUrl.searchParams.get('paths');

  if (!process.env.REVALIDATION_TOKEN || secret !== process.env.REVALIDATION_TOKEN) {
    return NextResponse.json({ revalidated: false, message: 'Invalid token' }, { status: 401 });
  }

  if (!paths) {
    return NextResponse.json({ revalidated: false, message: 'Path is required' }, { status: 400 });
  }

  try {
    paths.split(',').forEach((path) => {
      revalidatePath(path);
    });
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ revalidated: false, message: 'Error revalidating' }, { status: 500 });
  }
}
