import { Suspense } from 'react';

import Image from 'next/image';

import Button from '@/components/atoms/Button';
import CounterCard from '@/components/atoms/CounterCard';
import EventStatusBadge from '@/components/atoms/EventStatusBadge';
import SectionTitle from '@/components/atoms/SectionTitle';
import ErrorBoundary from '@/components/molecules/ErrorBoundary';
import ProjectsSlider from '@/components/molecules/ProjectsSlider';
import ShareAlarmSection from '@/components/molecules/ShareAlarmSection';
import { ArrowRightIcon } from '@/lib/assets/icons';

import styles from './index.module.scss';

function HomePage() {
  return (
    <>
      <section className={styles.homeSection}>
        <div className={styles.contentsWrapper}>
          <div className={styles.description}>
            <EventStatusBadge text="DND는 잠시 휴식중" type="info" />
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
          <Button type="button" size="xLarge">지원하기</Button>
        </div>
        <div className={styles.bannerWrapper}>
          <Image
            src="https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/banner/about.png"
            alt="main-banner"
            fill
            priority
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
      <SectionTitle title="DND의 프로젝트가 궁금하나요?" fullWidth>
        <ErrorBoundary>
          <Suspense>
            <ProjectsSlider />
            <Button href="/projects" buttonType="secondary" size="large" suffixIcon={<ArrowRightIcon />}>프로젝트 더 보기</Button>
          </Suspense>
        </ErrorBoundary>
      </SectionTitle>
      <SectionTitle title="DND는 어떻게 운영되나요?">
        <div className={styles.howBannerWrapper}>
          <div className={styles.howBannerItem}>
            <Image
              src="https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/home/how01.png"
              alt="DND 팀빌딩 시스템(DTS)"
              fill
              quality={100}
              sizes="(max-width: 1204px) 50vw, 33vw"
              className={styles.howBanner}
            />
          </div>
          <div className={styles.howBannerItem}>
            <Image
              src="https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/home/how02.png"
              alt="프로젝트 제작 가이드라인"
              fill
              quality={100}
              className={styles.howBanner}
              sizes="(max-width: 1204px) 50vw, 33vw"
            />
          </div>
          <div className={styles.howBannerItem}>
            <Image
              src="https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/home/how03.png"
              alt="다양한 교육 제공"
              fill
              quality={100}
              className={styles.howBanner}
              sizes="(max-width: 1204px) 50vw, 33vw"
            />
          </div>
        </div>
        <Button href="/dnd/about" buttonType="secondary" size="large" suffixIcon={<ArrowRightIcon />}>더 알아보기</Button>
      </SectionTitle>
      <SectionTitle title="DND article">
        <div />
      </SectionTitle>
      <SectionTitle title="DND NEWS">
        <div />
      </SectionTitle>
      <ShareAlarmSection />
      <SectionTitle title="자주 묻는 질문">
        <div />
      </SectionTitle>
    </>
  );
}

export default HomePage;
