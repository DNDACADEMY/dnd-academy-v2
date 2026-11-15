import dayjs, { type Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useEffect, useMemo, useState } from 'react';

import { parseEventDateTime } from '@/utils/parseEventDateTime';

dayjs.extend(duration);

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

const onCounter = (deadline: Dayjs) => {
  const diff = deadline.diff(dayjs());

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
  const deadline = useMemo(() => parseEventDateTime(deadlineDate), [deadlineDate]);
  const [countdown, setCountdown] = useState<string>(() => onCounter(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const counter = onCounter(deadline);

      if (counter === 'END') {
        setCountdown(counter);
        clearInterval(timer);
        return;
      }

      setCountdown(counter);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  return countdown;
};

export default useCountdown;
