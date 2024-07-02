import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

const onCounter = (date: string) => {
  const now = dayjs();
  const deadline = dayjs(date);
  const diff = deadline.diff(now);

  if (diff <= 0) {
    return 'END';
  }

  const diffDuration = dayjs.duration(diff);

  if (diff <= TWENTY_FOUR_HOURS_IN_MS) {
    return diffDuration.format('HH:mm:ss');
  }

  const days = Math.ceil(diffDuration.asDays());

  return `D-${days}`;
};

const useCountdown = (deadlineDate: string): 'END' | `D-${number}` | string => {
  const [countdown, setCountdown] = useState<string>(onCounter(deadlineDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const counter = onCounter(deadlineDate);

      if (counter === 'END') {
        setCountdown(counter);
        clearInterval(timer);
        return;
      }

      setCountdown(counter);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineDate]);

  return countdown;
};

export default useCountdown;
