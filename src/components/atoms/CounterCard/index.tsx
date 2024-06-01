'use client';

import CountUp from 'react-countup';

import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  title: string;
  count: number;
  suffix?: string;
  color?: 'primary' | 'default';
};

export function Counter({ count }: { count: number; }) {
  return (
    <CountUp enableScrollSpy scrollSpyOnce start={0} end={count} duration={5}>
      {({ countUpRef }) => (
        <strong data-testid="counter" ref={countUpRef} />
      )}
    </CountUp>
  );
}

function CounterCard({
  count, title, suffix = '명', color = 'default',
}: Props) {
  return (
    <div className={styles.counterCard}>
      <div className={clsx(styles.title, styles[color])}>{title}</div>
      <div className={clsx(styles.counter, styles[color])}>
        <Counter count={count} />
        &nbsp;
        {suffix}
      </div>
    </div>
  );
}

export default CounterCard;
