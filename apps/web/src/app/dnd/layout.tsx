import { PropsWithChildren } from 'react';

import styles from './layout.module.scss';

function layout({ children }: PropsWithChildren) {
  return (
    <>
      <div className={styles.space} />
      {children}
    </>
  );
}

export default layout;
