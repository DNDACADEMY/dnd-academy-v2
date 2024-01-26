import { Suspense } from 'react';

import dynamic from 'next/dynamic';
import Image from 'next/image';

import Button from '@/components/atoms/Button';
import CounterCard from '@/components/atoms/CounterCard';
import EventStatusBadge from '@/components/atoms/EventStatusBadge';
import SectionTitle from '@/components/atoms/SectionTitle';
import ErrorBoundary from '@/components/molecules/ErrorBoundary';
import ShareAlarmSection from '@/components/molecules/ShareAlarmSection';
import { ArrowRightIcon, LinkIcon } from '@/lib/assets/icons';

import styles from './index.module.scss';

const ProjectsSlider = dynamic(() => import('@/components/molecules/ProjectsSlider'), { ssr: false });

function HomePage() {
  const sponsors = [
    { sponsor: 'wanted', url: 'https://www.wanted.co.kr', imageUrl: 'wanted.png' },
    { sponsor: 'naver-d2', url: 'https://d2.naver.com', imageUrl: 'naver-d2.png' },
    { sponsor: 'hanbit', url: 'https://www.hanbit.co.kr', imageUrl: 'hanbit.png' },
    { sponsor: 'easys-publishing', url: 'http://www.easyspub.co.kr', imageUrl: 'easys-publishing.png' },
    { sponsor: 'witi', url: '#', imageUrl: 'witi.png' },
    { sponsor: 'maru180', url: 'https://maru.org', imageUrl: 'maru180.png' },
    { sponsor: 'asan-nanum', url: 'https://asan-nanum.org', imageUrl: 'asan-nanum.png' },
    { sponsor: 'impact-campus', url: 'https://impactcampus.campaignus.me', imageUrl: 'impact-campus.png' },
    { sponsor: 'notefolio', url: 'https://notefolio.net', imageUrl: 'notefolio.png' },
  ];

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
          </Suspense>
        </ErrorBoundary>
        <Button href="/projects" buttonType="secondary" size="large" suffixIcon={<ArrowRightIcon />}>프로젝트 더 보기</Button>
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
      <SectionTitle
        title="후원사"
        subTitle={(
          <>
            <strong>DND</strong>
            는&nbsp;
            <strong>서비스유지</strong>
            {'를 위해 후원을 받고 있습니다.\n후원 비용은 대관비, 장비 대여비, 세미나 연사 캐스팅비 등으로 더 많은 교육 기회에 도움이 됩니다.'}
          </>
        )}
      >
        <div className={styles.sponsorsWrapper}>
          {sponsors.map(({ sponsor, url, imageUrl }) => (
            <a key={sponsor} href={url} className={styles.sponsor} rel="noopener noreferrer" target="_blank">
              <Image
                src={`/assets/sponsor/${imageUrl}`}
                alt={sponsor}
                fill
                sizes="(max-width: 1204px) 50vw, 33vw"
                className={styles.sponsorImage}
              />
            </a>
          ))}
        </div>
        <Button
          isExternalLink
          href="https://mahogany-base-b4f.notion.site/98c7848ce8ba4f48aa4153388fb39a1b"
          buttonType="clear"
          size="large"
          suffixIcon={<LinkIcon />}
        >
          후원 문의하기
        </Button>
      </SectionTitle>
    </>
  );
}

export default HomePage;
