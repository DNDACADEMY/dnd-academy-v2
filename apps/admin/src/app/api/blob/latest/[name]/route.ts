import { NextRequest, NextResponse } from 'next/server';

import { api, ApiError, getLatestItemReduce } from '@dnd-academy/core';
import { list } from '@vercel/blob';

// eslint-disable-next-line import/prefer-default-export
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const fileName = searchParams.get('name');

  if (!fileName) {
    return NextResponse.json(null, {
      status: 400,
      statusText: 'Missing name parameter',
    });
  }

  const { blobs } = await list({
    prefix: fileName,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const blob = getLatestItemReduce(blobs);

  try {
    const responseBlobData = await api({
      url: blob.url,
      method: 'GET',
    });

    return Response.json(responseBlobData);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({
        error: error.message,
      }, {
        status: error.status,
        statusText: error.message,
      });
    }

    return NextResponse.json({
      error: 'Internal Server Error',
    }, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
