'use client';

import { ReactNode, useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Snowfall } from 'react-snowfall';

import * as ChannelService from '@channel.io/channel-web-sdk-loader';
import { useMediaQuery } from 'usehooks-ts';

import BREAK_POINT from '@/lib/constants/breakPoint';

function ClientProviders({ children }: { children: ReactNode }) {
  const isSmall = useMediaQuery(BREAK_POINT.small);
  const isXLarge = useMediaQuery(BREAK_POINT.xLarge);

  const getSnowflakeCount = () => {
    if (isXLarge) {
      return 100;
    }

    if (isSmall) {
      return 60;
    }

    return 80;
  };

  useEffect(() => {
    ChannelService.loadScript();
    ChannelService.boot({ pluginKey: process.env.NEXT_PUBLIC_CHANNEL_IO_PLUGIN_KEY });
  }, []);

  return (
    <PerfectScrollbar>
      <Snowfall
        snowflakeCount={getSnowflakeCount()}
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 100,
        }}
      />
      {children}
    </PerfectScrollbar>
  );
}

export default ClientProviders;
