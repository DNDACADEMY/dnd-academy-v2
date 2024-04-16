'use client';

import CountUp from 'react-countup';

import styles from './index.module.scss';

type Props = {
  title: string;
  count: number;
  suffix?: string;
  onEnd?: () => void;
};

function CounterCard({
  count, title, suffix = '명', onEnd,
}: Props) {
  return (
    <div className={styles.counterCard}>
      <div className={styles.title}>{title}</div>
      <div className={styles.counter}>
        <CountUp start={0} end={count} duration={5} onEnd={onEnd}>
          {({ countUpRef }) => (
            <strong data-testid="counter" ref={countUpRef} />
          )}
        </CountUp>
        &nbsp;
        {suffix}
      </div>
    </div>
  );
}

export default CounterCard;
