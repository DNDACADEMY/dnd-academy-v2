import { PropsWithChildren } from 'react';

import styles from './index.module.scss';

type Props = {
  title: string;
};

function SectionTitle({ title, children }: PropsWithChildren<Props>) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </section>
  );
}

export default SectionTitle;
