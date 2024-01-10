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
        <strong>{count}</strong>
        &nbsp;
        {suffix}
      </div>
    </div>
  );
}

export default CounterCard;
