'use client';

import { PropsWithChildren } from 'react';

import { useIsMounted } from '@dnd-academy/ui/client';

function ClientOnly({ children }: PropsWithChildren) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return children;
}

export default ClientOnly;
