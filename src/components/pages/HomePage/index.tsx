import Image from 'next/image';

import CounterCard from '@/components/atoms/CounterCard';
import EventStatusBadge from '@/components/atoms/EventStatusBadge';
import SectionTitle from '@/components/atoms/SectionTitle';

import styles from './index.module.scss';

function HomePage() {
  return (
    <>
      <section className={styles.homeSection}>
        <div className={styles.contentsWrapper}>
          <div className={styles.description}>
            <EventStatusBadge text="DND는 잠시 휴식중" type="info" />
            <EventStatusBadge text="DND는 잠시 휴식중" type="error" />
            <EventStatusBadge text="DND는 잠시 휴식중" type="warn" />
            <EventStatusBadge text="DND는 잠시 휴식중" type="success" />
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
            sizes="(max-width: 1204px) 50vw, 33vw"
            className={styles.banner}
          />
        </div>
      </section>
      <SectionTitle title="지금까지 DND는?">
        <div className={styles.counterCardWrapper}>
          <CounterCard count={962} title="누적 지원자 수" />
          <CounterCard count={200} title="총 참가자 수" />
          <CounterCard count={34} title="총 프로젝트 수" suffix="개" />
          <CounterCard count={0} title="10기 이탈자" />
        </div>
      </SectionTitle>
      <SectionTitle title="DND의 프로젝트가 궁금하나요?">
        <div />
      </SectionTitle>
      <SectionTitle title="DND는 어떻게 운영되나요?">
        <div />
      </SectionTitle>
      <SectionTitle title="DND article">
        <div />
      </SectionTitle>
      <SectionTitle title="DND NEWS">
        <div />
      </SectionTitle>
    </>
  );
}

export default HomePage;
