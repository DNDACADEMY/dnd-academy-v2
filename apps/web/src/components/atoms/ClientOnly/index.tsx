'use client';

import { useIsMounted } from '@dnd-academy/ui/client';
import { PropsWithChildren, ReactNode } from 'react';

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
