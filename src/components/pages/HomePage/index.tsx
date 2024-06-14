import Image from 'next/image';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import { Counter } from '@/components/atoms/CounterCard';
import ImageCard from '@/components/atoms/ImageCard';
import ScrollElement from '@/components/atoms/ScrollElement';
import SectionTitle from '@/components/atoms/SectionTitle';
import CounterCardSection from '@/components/molecules/CounterCardSection';
import FAQSection from '@/components/molecules/FAQSection';
import ProjectsSlider from '@/components/molecules/ProjectsSlider';
import SponsorSection from '@/components/molecules/SponsorSection';
import ApplyModal from '@/components/organisms/ApplyModal';
import ShareAlarmSection from '@/components/templates/ShareAlarmSection';
import { getCurrentApplicantCount } from '@/lib/apis/count';
import { faqData } from '@/lib/assets/data';
import { RightArrowIcon } from '@/lib/assets/icons';

import styles from './index.module.scss';

function HomePage() {
  const currentApplicantCount = getCurrentApplicantCount();

  return (
    <>
      <section className={styles.homeSection}>
        <div className={styles.contentsWrapper}>
          <div className={styles.description}>
            <Badge label="DND는 잠시 휴식중" variant="info" />
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
            <div className={styles.counter}>
              오늘까지&nbsp;
              <Counter count={currentApplicantCount.designer + currentApplicantCount.developer} />
              명이 지원했어요!
            </div>
          </div>
          <ApplyModal>
            <Button size="xLarge" buttonType="primary" />
          </ApplyModal>
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
      <CounterCardSection title="지금까지 DND는?" />
      <SectionTitle title="DND의 프로젝트가 궁금하나요?" fullWidth>
        <ProjectsSlider />
        <Button href="/projects" size="large" suffixIcon={<RightArrowIcon width={24} height={24} />}>프로젝트 더 보기</Button>
      </SectionTitle>
      <SectionTitle title="DND는 어떻게 운영되나요?">
        <div className={styles.howBannerWrapper}>
          <ImageCard
            url="/assets/images/dnd-experience-01.png"
            alt="DND 팀빌딩 시스템(DTS)"
            backgroundColorType="primary"
            description={
              <div className={styles.imageBannerTitle}>DND 팀빌딩 시스템(DTS)</div>
            }
          />
          <ImageCard
            url="/assets/images/dnd-experience-02.png"
            alt="프로젝트 제작 가이드라인"
            backgroundColorType="secondary"
            description={
              <div className={styles.imageBannerTitle}>프로젝트 제작 가이드라인</div>
            }
          />
          <ImageCard
            url="/assets/images/dnd-experience-03.png"
            alt="다양한 교육 제공"
            backgroundColorType="tertiary"
            description={
              <div className={styles.imageBannerTitle}>다양한 교육 제공</div>
            }
          />
          {/* <div className={styles.howBannerItem}>
            <Image
              src="https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/home/how01.png"
              alt="DND 팀빌딩 시스템(DTS)"
              fill
              quality={100}
              sizes="(max-width: 1204px) 50vw, 33vw"
            />
          </div>
          <div className={styles.howBannerItem}>
            <Image
              src="https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/home/how02.png"
              alt="프로젝트 제작 가이드라인"
              fill
              quality={100}
              sizes="(max-width: 1204px) 50vw, 33vw"
            />
          </div>
          <div className={styles.howBannerItem}>
            <Image
              src="https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/home/how03.png"
              alt="다양한 교육 제공"
              fill
              quality={100}
              sizes="(max-width: 1204px) 50vw, 33vw"
            />
          </div> */}
        </div>
        <Button href="/dnd/about" size="large" suffixIcon={<RightArrowIcon width={24} height={24} />}>더 알아보기</Button>
      </SectionTitle>
      <SectionTitle title="DND NEWS">
        <div />
      </SectionTitle>
      <ShareAlarmSection />
      <SectionTitle title="자주 묻는 질문">
        <ScrollElement paramKey="faq" scrollIntoViewOptions={{ block: 'start', behavior: 'smooth' }}>
          <FAQSection faq={faqData} />
        </ScrollElement>
      </SectionTitle>
      <SponsorSection />
    </>
  );
}

export default HomePage;
