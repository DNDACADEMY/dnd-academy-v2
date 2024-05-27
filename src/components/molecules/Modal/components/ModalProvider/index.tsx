import {
  createContext, Dispatch, PropsWithChildren, SetStateAction, useMemo, useState,
} from 'react';

import { useScrollLock } from 'usehooks-ts';

type ModalContextType = [boolean, Dispatch<SetStateAction<boolean>>];

export const ModalContext = createContext<ModalContextType>({} as ModalContextType);

function ModalProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const contextValue = useMemo<ModalContextType>(
    () => [isOpen, setIsOpen],
    [isOpen],
  );

  useScrollLock({
    autoLock: isOpen,
  });

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}

export default ModalProvider;
