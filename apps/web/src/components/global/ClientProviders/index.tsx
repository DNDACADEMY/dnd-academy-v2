'use client';

import * as ChannelService from '@channel.io/channel-web-sdk-loader';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

import SnowfallSection from '@/components/organisms/SnowfallSection';
import { isChristmasTheme } from '@/utils';

function ClientProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const nativeScroll =
    pathname === '/admin' || pathname === '/submit-content' || pathname?.startsWith('/submit-content/');

  useEffect(() => {
    ChannelService.loadScript();
    ChannelService.boot({ pluginKey: process.env.NEXT_PUBLIC_CHANNEL_IO_PLUGIN_KEY });
  }, []);

  // These screens scroll with the document. The custom rail can inflate its height in Safari.
  if (nativeScroll) return children;

  return (
    <PerfectScrollbar>
      {isChristmasTheme() && <SnowfallSection />}
      {children}
    </PerfectScrollbar>
  );
}

export default ClientProviders;
