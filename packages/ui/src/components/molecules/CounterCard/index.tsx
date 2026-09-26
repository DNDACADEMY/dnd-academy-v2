'use client';

import clsx from 'clsx';
import { CountUp } from 'countup.js';
import { useEffect, useRef } from 'react';

import styles from './index.module.scss';

type Props = {
  title: string;
  count: number;
  suffix?: string;
  color?: 'gray' | 'red' | 'green';
  highlight?: boolean;
};

export function Counter({ count }: { count: number }) {
  const counterRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!counterRef.current) {
      return;
    }

    new CountUp(counterRef.current, count, {
      startVal: 0,
      duration: 5,
      enableScrollSpy: true,
      scrollSpyOnce: true,
    });
  }, [count]);

  return <strong data-testid="counter" ref={counterRef} />;
}

function CounterCard({ count, title, suffix = '명', color = 'gray', highlight = false }: Props) {
  return (
    <div className={clsx(styles.counterCard, styles[color])}>
      <div className={clsx(styles.title, highlight && styles.highlight)}>{title}</div>
      <div className={clsx(styles.counter, highlight && styles.highlight)}>
        <Counter count={count} />
        &nbsp;
        <span className={styles.suffix}>{suffix}</span>
      </div>
    </div>
  );
}

export default CounterCard;
