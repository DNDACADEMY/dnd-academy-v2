import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  variant: 'notice' | 'error' | 'success' | 'info';
  theme?: 'light' | 'dark';
  size?: 'medium' | 'large';
  label: string;
};

function Badge({
  label, variant, size = 'medium', theme = 'dark',
}: Props) {
  return (
    <div className={clsx(styles.badge, {
      [styles[variant]]: variant,
      [styles[size]]: size,
      [styles[theme]]: theme,
    })}
    >
      {label}
    </div>
  );
}

export default Badge;
