import { PropsWithChildren } from 'react';

import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  title: string;
  fullWidth?: boolean;
};

function SectionTitle({ title, fullWidth, children }: PropsWithChildren<Props>) {
  return (
    <section className={clsx(styles.section, fullWidth && styles.fullWidth)}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </section>
  );
}

export default SectionTitle;
