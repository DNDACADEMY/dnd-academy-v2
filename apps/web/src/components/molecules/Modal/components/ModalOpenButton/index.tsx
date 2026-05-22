import {
  ButtonHTMLAttributes,
  cloneElement, MouseEvent, ReactElement,
} from 'react';

import { useModalContext } from '@/components/molecules/Modal/components/ModalProvider';

function ModalOpenButton({
  children: child,
} : { children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>> }) {
  const { toggle } = useModalContext();

  // NOTE - cloneElement로 자식 버튼에 모달 오픈 동작을 주입하는 계약입니다. 변경 시 기존 onClick 합성 동작을 함께 확인해야 합니다.
  return cloneElement(child, {
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      toggle(true);
      child.props.onClick?.(e);
    },
  });
}

export default ModalOpenButton;
