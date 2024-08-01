import {
  ButtonHTMLAttributes,
  cloneElement, MouseEvent, ReactElement,
} from 'react';

import { useModalContext } from '@/components/molecules/Modal/components/ModalProvider';

function ModalOpenButton({
  children: child,
} : { children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>> }) {
  const { toggle } = useModalContext();

  return cloneElement(child, {
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      toggle(true);
      child.props.onClick?.(e);
    },
  });
}

export default ModalOpenButton;
