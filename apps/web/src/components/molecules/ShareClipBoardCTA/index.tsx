'use client';

import { ButtonHTMLAttributes, cloneElement, isValidElement, MouseEvent, type ReactElement } from 'react';

import useClipboard from '@/hooks/useClipboard';

type Props = {
  shareText: string;
  children?: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
};

function ShareClipBoardCTA({ shareText, children: child }: Props) {
  const onClickShare = useClipboard();

  if (!isValidElement<ButtonHTMLAttributes<HTMLButtonElement>>(child)) {
    return null;
  }

  // NOTE - cloneElement로 자식 버튼에 클립보드 복사 동작을 주입하는 계약입니다. 변경 시 기존 onClick 합성 동작을 함께 확인해야 합니다.
  return cloneElement(child, {
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      onClickShare(shareText);
      child.props.onClick?.(e);
    },
  });
}

export default ShareClipBoardCTA;
