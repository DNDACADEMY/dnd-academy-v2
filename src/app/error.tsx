'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string }
  reset: () => void
};

function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button
        type="button"
        onClick={
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  );
}

export default ErrorPage;
