import { ComponentType, JSX, ReactNode } from 'react';

import { api, type ApiRequest, serverErrorHandling } from '@dnd-academy/core';

function withServerErrorBoundary<T, P extends object | undefined>(
  WrappedComponent: ComponentType<P & { data: T }>,
  apiRequest: ApiRequest<T>,
) {
  return function WithServerErrorBoundary(props: Omit<P, 'data'>): JSX.Element {
    const data = serverErrorHandling(() => api(apiRequest));

    return (
      <AsyncRenderer
        data={data}
        fallback={<div>Failed to fetch data</div>}
      >
        {(resolvedData) => (
          <WrappedComponent
              // eslint-disable-next-line react/jsx-props-no-spreading
            {...(props as P)}
            data={resolvedData as T}
          />
        )}
      </AsyncRenderer>
    );
  };
}

async function AsyncRenderer<T>({
  data,
  children,
  fallback,
}: {
  data: Promise<T>;
  children: (data: T) => ReactNode;
  fallback: ReactNode;
}) {
  const resolvedData = await data;

  if (!resolvedData) {
    return fallback;
  }

  return children(resolvedData);
}

export default withServerErrorBoundary;
