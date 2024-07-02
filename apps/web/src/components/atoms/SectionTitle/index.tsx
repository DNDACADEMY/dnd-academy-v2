import { PropsWithChildren, ReactElement, ReactNode } from 'react';

import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  title: string;
  subTitle?: ReactElement | ReactNode;
  fullWidth?: boolean;
};

function SectionTitle({
  title, subTitle, fullWidth, children,
}: PropsWithChildren<Props>) {
  return (
    <section className={clsx(styles.section, fullWidth && styles.fullWidth)}>
      <div className={styles.titleWrapper}>
        <h2 className={styles.title}>{title}</h2>
        {subTitle && <div className={styles.subTitle}>{subTitle}</div>}
      </div>
      {children}
    </section>
  );
}

export default SectionTitle;
