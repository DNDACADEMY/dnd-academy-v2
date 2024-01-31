import styles from './index.module.scss';

type Props = {
  title: string;
  subTitle: string;
};

function PageTitle({ title, subTitle }: Props) {
  return (
    <div className={styles.pageTitleWrapper}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.subTitle}>{subTitle}</div>
    </div>
  );
}

export default PageTitle;
