'use client';

import CountUp from 'react-countup';

import styles from './index.module.scss';

type Props = {
  title: string;
  count: number;
  suffix?: string;
};

function CounterCard({ count, title, suffix = '명' }: Props) {
  return (
    <div className={styles.counterCard}>
      <div className={styles.title}>{title}</div>
      <div className={styles.counter}>
        <CountUp enableScrollSpy scrollSpyOnce start={0} end={count} duration={5}>
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
