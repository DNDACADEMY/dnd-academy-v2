import {
  ButtonHTMLAttributes,
  cloneElement, MouseEvent, ReactElement, useContext,
} from 'react';

import { ModalContext } from '../ModalProvider';

function ModalOpenButton({
  children: child,
} : { children: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>> }) {
  const modalContext = useContext(ModalContext);

  if (!modalContext) {
    throw new Error('ModalOpenButton must be used inside a Modal');
  }

  const [, setIsOpen] = modalContext;

  return cloneElement(child, {
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      setIsOpen(true);
      child.props.onClick?.(e);
    },
  });
}

export default ModalOpenButton;
