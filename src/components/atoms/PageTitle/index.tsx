import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  title: string;
  subTitle?: string;
};

function PageTitle({ title, subTitle }: Props) {
  return (
    <div className={clsx(styles.pageTitleWrapper, subTitle && styles.hasSubtitle)}>
      <h1 className={styles.title}>{title}</h1>
      {subTitle && (
        <div className={styles.subTitle}>{subTitle}</div>
      )}
    </div>
  );
}

export default PageTitle;
