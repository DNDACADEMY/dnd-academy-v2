'use client';

import CountUp from 'react-countup';

import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  title: string;
  count: number;
  suffix?: string;
  color?: 'gray' | 'red' | 'green';
  highlight?: boolean;
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
  count, title, suffix = '명', color = 'gray', highlight = false,
}: Props) {
  return (
    <div className={clsx(styles.counterCard, styles[color])}>
      <div className={clsx(styles.title, highlight && styles.highlight)}>
        {title}
      </div>
      <div className={clsx(styles.counter, highlight && styles.highlight)}>
        <Counter count={count} />
        &nbsp;
        <span className={styles.suffix}>{suffix}</span>
      </div>
    </div>
  );
}

export default CounterCard;
