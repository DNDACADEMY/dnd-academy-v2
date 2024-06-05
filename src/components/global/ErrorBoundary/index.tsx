'use client';

import { PropsWithChildren, useCallback } from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

import { QueryErrorResetBoundary } from '@tanstack/react-query';

function ErrorBoundary({ children }: PropsWithChildren) {
  const memoizedFallbackComponent = useCallback(({ error }: FallbackProps) => {
    console.error(error);

    // TODO - 추후 에러페이지 구현
    return (
      <div>에러가 발생했어요</div>
    );
  }, []);

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ReactErrorBoundary
          onReset={reset}
          fallbackRender={memoizedFallbackComponent}
        >
          {children}
        </ReactErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default ErrorBoundary;
