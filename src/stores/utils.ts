import { StoreApi } from 'zustand';
import { shallow } from 'zustand/shallow';
import { UseBoundStoreWithEqualityFn } from 'zustand/traditional';

export type StoreWithShallow<T> = <K extends keyof T>(
  keys: K[], withEqualityFn?: boolean) => Pick<T, K>;

export const useStoreWithShallow = <T, K extends keyof T>(
  storeWithEqualityFn: UseBoundStoreWithEqualityFn<StoreApi<T>>,
  keys: K[],
  withEqualityFn = true,
): Pick<T, K> => storeWithEqualityFn<T>((state) => {
    const resultState = keys.reduce((prev, key) => ({
      ...prev,
      [key]: state[key],
    }), {} as T);

    return resultState;
  }, withEqualityFn ? shallow : undefined);
