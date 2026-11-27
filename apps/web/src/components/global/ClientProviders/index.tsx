'use client';

import * as ChannelService from '@channel.io/channel-web-sdk-loader';
import { ReactNode, useEffect } from 'react';

import SnowfallSection from '@/components/organisms/SnowfallSection';
import { isChristmasTheme } from '@/utils';

function ClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    ChannelService.loadScript();
    ChannelService.boot({ pluginKey: process.env.NEXT_PUBLIC_CHANNEL_IO_PLUGIN_KEY });
  }, []);

  return (
    <>
      {isChristmasTheme() && <SnowfallSection />}
      {children}
    </>
  );
}

export default ClientProviders;
