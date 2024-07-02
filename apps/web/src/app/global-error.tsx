'use client';

import { useEffect } from 'react';

import { pretendardFont } from './_fonts';

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
    <html lang="ko" className={pretendardFont.className}>
      <body>
        <h2>Something went wrong!</h2>
        <button type="button" onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}

export default ErrorPage;
