import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  title: string;
  isActive?: boolean;
  onClick?: () => void;
};

function Tag({ title, onClick, isActive }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(styles.tag, isActive && styles.active)}
    >
      {title}
    </button>
  );
}

export default Tag;
