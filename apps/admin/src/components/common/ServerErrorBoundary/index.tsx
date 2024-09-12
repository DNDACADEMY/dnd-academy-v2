import { ReactNode } from 'react';

import { api, type ApiRequest } from '@dnd-academy/core';

import { serverErrorHandling } from '@/utils';

type Props<T> = {
  apiRequest: ApiRequest<T>;
  children: (data: T) => ReactNode;
};

function ServerErrorBoundary<T>({ apiRequest, children }: Props<T>) {
  const data = serverErrorHandling(
    () => api(apiRequest),
  );

  return (
    <>
      {/* @ts-expect-error Server Component */}
      <AsyncRenderer data={data} fallback={<div>Failed to fetch data</div>}>
        {children}
      </AsyncRenderer>
    </>
  );
}

async function AsyncRenderer<T>({
  data,
  children,
  fallback,
}: {
  data: Promise<T>,
  children: (data: T) => ReactNode,
  fallback: ReactNode
}) {
  const resolvedData = await data;

  if (!resolvedData) {
    return fallback;
  }

  return children(resolvedData);
}

export default ServerErrorBoundary;
