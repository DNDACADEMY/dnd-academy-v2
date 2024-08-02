'use client';

import { ReactNode, useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

import * as ChannelService from '@channel.io/channel-web-sdk-loader';

function ClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    ChannelService.loadScript();
    ChannelService.boot({ pluginKey: process.env.NEXT_PUBLIC_CHANNEL_IO_PLUGIN_KEY });
  }, []);

  return (
    <PerfectScrollbar>
      {children}
    </PerfectScrollbar>
  );
}

export default ClientProviders;
