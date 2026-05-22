import { NextRequest, NextResponse } from 'next/server';

import { api, ApiError, getLatestItemReduce } from '@dnd-academy/core';
import { list } from '@vercel/blob';

const ALLOWED_BLOB_NAMES = new Set(['current_applicant_count', 'total_count_status']);

export async function GET(_: NextRequest, props: { params: Promise<{ name: string }> }) {
  const params = await props.params;

  if (!params?.name || !ALLOWED_BLOB_NAMES.has(params.name)) {
    return NextResponse.json(null, {
      status: 400,
      statusText: 'Invalid name parameter',
    });
  }

  const { blobs } = await list({
    prefix: params.name,
    token: process.env.DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN,
  });

  if (!blobs.length) {
    return NextResponse.json(null, {
      status: 404,
      statusText: 'Blob not found',
    });
  }

  const blob = getLatestItemReduce(blobs);

  try {
    const responseBlobData = await api({
      url: blob.url,
      method: 'GET',
    });

    return Response.json(responseBlobData);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: error.status,
          statusText: error.message,
        },
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      },
    );
  }
}
