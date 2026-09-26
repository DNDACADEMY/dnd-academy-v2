import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export default useIsMounted;
