import { createWithEqualityFn as create } from 'zustand/traditional';

import { StoreWithShallow, useStoreWithShallow } from './utils';

type ToastType = 'warn' | 'info' | 'success' | 'error';

type ToastState = {
  message: string;
  type: ToastType;
  isRender: boolean;
  delay: number;
};

type ToastAction = {
  renderToast: (
    message: string, toastOption?: { type?: ToastType; delay?: number }
  ) => void;
  closeToast: () => void;
};

export type ToastStore = ToastState & ToastAction;

const initialToastState: ToastState = {
  message: '',
  delay: 0,
  isRender: false,
  type: 'success',
};

const toastStore = create<ToastStore>((set) => ({
  ...initialToastState,
  renderToast: (message, { delay = 2000, type = 'info' } = {}) => set((state) => ({
    ...state, isRender: true, message, delay, type,
  })),
  closeToast: () => set(() => ({ ...initialToastState })),
}));

const useToastStore: StoreWithShallow<ToastStore> = (keys) => useStoreWithShallow(toastStore, keys);

export default useToastStore;
