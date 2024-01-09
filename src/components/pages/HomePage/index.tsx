import Image from 'next/image';

import styles from './index.module.scss';

function HomePage() {
  return (
    <section className={styles.homeSection}>
      <div className={styles.contentsWrapper}>
        <div className={styles.description}>
          <div>badge</div>
          <h1 className={styles.title}>
            {`프로젝트에 즐거움을
              모두에게 기회를`}
          </h1>
          <div className={styles.subTitle}>
            <strong>DND</strong>
            는&nbsp;
            <strong>개발자</strong>
            와&nbsp;
            <strong>디자이너</strong>
            를 위한
            <br />
            계속해서 성장하는&nbsp;
            <strong>IT비영리단체</strong>
            입니다.
          </div>
          <div className={styles.counter}>오늘까지 000명이 지원했어요!</div>
        </div>
        <button type="button">지원하기</button>
      </div>
      <div className={styles.bannerWrapper}>
        <Image
          src="https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/banner/about.png"
          alt="main-banner"
          fill
          sizes="(max-width: 1156px) 50vw, 33vw"
          className={styles.banner}
        />
      </div>
    </section>
  );
}

export default HomePage;
