'use client';

import { PropsWithChildren, ReactNode } from 'react';

import { useIsMounted } from '@dnd-academy/ui/client';

type Props = {
  loading?: ReactNode;
};

function ClientOnly({ children, loading }: PropsWithChildren<Props>) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return loading || null;
  }

  return children;
}

export default ClientOnly;
