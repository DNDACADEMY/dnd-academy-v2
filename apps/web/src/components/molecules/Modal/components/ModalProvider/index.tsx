import {
  createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useMemo, useState,
} from 'react';

import { useScrollLock } from 'usehooks-ts';

type ModalContextType = [boolean, Dispatch<SetStateAction<boolean>>];

const ModalContext = createContext<ModalContextType>({} as ModalContextType);

export const useModalContext = () => {
  const context = useContext(ModalContext);

  if (context === null) {
    throw new Error('useModalContext must be used inside a ModalProvider');
  }

  return context;
};

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
