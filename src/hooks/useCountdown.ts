import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

const useCountdown = (deadlineDate: string): 'END' | `D-${number}` | string => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = dayjs();
      const deadline = dayjs(deadlineDate);
      const diff = deadline.diff(now);

      if (diff <= 0) {
        setCountdown('END');
        clearInterval(timer);
        return;
      }

      const diffDuration = dayjs.duration(diff);

      if (diff <= TWENTY_FOUR_HOURS_IN_MS) {
        setCountdown(diffDuration.format('HH:mm:ss'));
        return;
      }

      const days = Math.ceil(diffDuration.asDays());
      setCountdown(`D-${days}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineDate]);

  return countdown;
};

export default useCountdown;
