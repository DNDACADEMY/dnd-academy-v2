'use client';

import { PropsWithChildren } from 'react';

import { useIsMounted } from '@dnd-academy/ui/client';
import { useMediaQuery } from 'usehooks-ts';

import BREAK_POINT from '@/lib/constants/breakPoint';

type Props = {
  breakPoint: keyof typeof BREAK_POINT;
  inverse?: boolean;
};

function ResponsiveContainer({ breakPoint, inverse = false, children }: PropsWithChildren<Props>) {
  const isMounted = useIsMounted();
  const isSmall = useMediaQuery(BREAK_POINT.small);
  const isMedium = useMediaQuery(BREAK_POINT.medium);
  const isLarge = useMediaQuery(BREAK_POINT.large);
  const isXLarge = useMediaQuery(BREAK_POINT.xLarge);

  if (!isMounted) {
    return null;
  }

  const shouldRender = (
    (isSmall && breakPoint === 'small')
    || (isMedium && breakPoint === 'medium')
    || (isLarge && breakPoint === 'large')
    || (isXLarge && breakPoint === 'xLarge')
  );

  if (inverse) {
    return shouldRender ? null : children;
  }

  return shouldRender ? children : null;
}

export default ResponsiveContainer;
