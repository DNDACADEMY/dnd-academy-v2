import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line import/prefer-default-export
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const paths = request.nextUrl.searchParams.get('paths');

  if (secret !== process.env.REVALIDATION_TOKEN) {
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
