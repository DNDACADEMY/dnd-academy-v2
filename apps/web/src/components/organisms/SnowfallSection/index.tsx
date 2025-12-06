'use client';

import { useMemo } from 'react';
import { Snowfall } from 'react-snowfall';

import { useMediaQuery } from 'usehooks-ts';

import BREAK_POINT from '@/lib/constants/breakPoint';

function SnowfallSection() {
  const isSmall = useMediaQuery(BREAK_POINT.small);
  const isXLarge = useMediaQuery(BREAK_POINT.xLarge);

  const snowflakeCount = useMemo(() => {
    if (isXLarge) {
      return 100;
    }

    if (isSmall) {
      return 60;
    }

    return 80;
  }, [isSmall, isXLarge]);

  return (
    <Snowfall
      style={
        {
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 100,
        }
    }
      snowflakeCount={snowflakeCount}
    />
  );
}

export default SnowfallSection;
