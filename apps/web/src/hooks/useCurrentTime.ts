import { useMemo, useState } from 'react';

import { useInterval } from 'usehooks-ts';

const useCurrentTime = (enabledInterval: boolean) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const delay = useMemo(() => {
    if (!enabledInterval) {
      return null;
    }

    return 1000;
  }, [enabledInterval]);

  useInterval(() => setCurrentTime(Date.now()), delay);

  return useMemo(() => currentTime, [currentTime]);
};

export default useCurrentTime;
