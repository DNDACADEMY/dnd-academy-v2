'use client';

import { ReactNode } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <PerfectScrollbar>
      {children}
    </PerfectScrollbar>
  );
}

export default ClientProviders;
