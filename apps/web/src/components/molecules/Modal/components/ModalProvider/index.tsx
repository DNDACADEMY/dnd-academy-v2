import {
  createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useMemo, useState,
} from 'react';

type ModalContextType = { open: boolean; toggle: Dispatch<SetStateAction<boolean>>; };

const ModalContext = createContext<ModalContextType>({} as ModalContextType);

export const useModalContext = () => {
  const context = useContext(ModalContext);

  if (context === null) {
    throw new Error('useModalContext must be used inside a ModalProvider');
  }

  return context;
};

function ModalProvider({ children }: PropsWithChildren) {
  const [open, toggle] = useState<boolean>(false);
  const contextValue = useMemo<ModalContextType>(
    () => ({ open, toggle }),
    [open],
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}

export default ModalProvider;
