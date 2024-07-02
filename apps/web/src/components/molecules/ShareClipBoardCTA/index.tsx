'use client';

import {
  ButtonHTMLAttributes, cloneElement, MouseEvent, ReactElement,
} from 'react';

import useClipboard from '@/hooks/useClipboard';

type Props = {
  shareText: string;
  children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
};

function ShareClipBoardCTA({ shareText, children: child }: Props) {
  const onClickShare = useClipboard();

  return cloneElement(child, {
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      onClickShare(shareText);
      child.props.onClick?.(e);
    },
  });
}

export default ShareClipBoardCTA;
