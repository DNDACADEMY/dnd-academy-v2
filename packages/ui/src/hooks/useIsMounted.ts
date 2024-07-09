import { useEffect, useState } from 'react';

/**
 * PageTitle component
 * @module @dnd-academy/ui/client
 */
function useIsMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

export default useIsMounted;
