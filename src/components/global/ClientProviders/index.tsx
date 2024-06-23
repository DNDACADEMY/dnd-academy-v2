'use client';

import { ReactNode } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

import * as ChannelService from '@channel.io/channel-web-sdk-loader';

ChannelService.loadScript();
ChannelService.boot({ pluginKey: process.env.NEXT_PUBLIC_CHANNEL_IO_PLUGIN_KEY });

function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <PerfectScrollbar>
      {children}
    </PerfectScrollbar>
  );
}

export default ClientProviders;
