'use client';

import { PropsWithChildren } from 'react';

import useIsMounted from '@/hooks/useIsMounted';

function ClientOnly({ children }: PropsWithChildren) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return children;
}

export default ClientOnly;
