import { Suspense } from 'react';

function withSuspense<P extends object>(WrappedComponent: React.ComponentType<P>) {
  function WithSuspense(props: P) {
    return (
      <Suspense>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <WrappedComponent {...props} />
      </Suspense>
    );
  }

  return WithSuspense;
}

export default withSuspense;
