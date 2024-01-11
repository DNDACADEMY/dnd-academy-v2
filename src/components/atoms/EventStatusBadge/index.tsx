import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  type: 'warn' | 'error' | 'success' | 'info';
  text: string;
};

function EventStatusBadge({ text, type }: Props) {
  return (
    <div className={clsx(styles.eventStatusBadge, {
      [styles[type]]: type,
    })}
    >
      {text}
    </div>
  );
}

export default EventStatusBadge;
