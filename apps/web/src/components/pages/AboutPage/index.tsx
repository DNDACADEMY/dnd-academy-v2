import Marquee from 'react-fast-marquee';

import Image from 'next/image';

import PageTitle from '@/components/atoms/PageTitle';
import SectionTitle from '@/components/atoms/SectionTitle';
import ImageCard from '@/components/molecules/ImageCard';
import CounterCardSection from '@/components/organisms/CounterCardSection';
import GuidelineSection from '@/components/organisms/GuidelineSection';

import styles from './index.module.scss';

function AboutPage() {
  return (
    <>
      <section className={styles.introduceSection}>
        <PageTitle title="소개" />
        <Marquee autoFill>
          <div className={styles.introduceImageWrapper}>
            {Array.from({ length: 8 }, (_, i) => i).map((number) => (
              <Image
                key={number}
                className={styles.image}
                src={`/assets/images/dnd-${number + 1}.png`}
                alt={`dnd-introduce-image-${number + 1}`}
                sizes="(max-width: 1204px) 50vw, 33vw"
                width={0}
                height={0}
                priority
              />
            ))}
          </div>
        </Marquee>
        <p className={styles.description}>
          {'DND는 서울에 편중되어 있는 기술 공유와 세미나를 지방에서도 나누고자\n2019년 설립되었습니다.\n'}
          <br />
          <strong>‘프로젝트에 즐거움을, 모두에게 기회를’</strong>
          {'이라는 슬로건 아래 우리는 함께 배우고 자라며\n교육 기회의 평등함을 위해 8주간 개발자와 디자이너가 협업하는 사이드 프로젝트와\n지식 나눔 세미나를 적극적으로 운영하고 있습니다.'}
        </p>
      </section>
      <CounterCardSection title="계속 성장하는 DND" />
      <SectionTitle title="DND에서 어떤 경험을 할 수 있을까요?">
        <div className={styles.dndExperienceWrapper}>
          <ImageCard
            fullWidth
            url="/assets/images/dnd-experience-01.png"
            alt="DND 팀빌딩 시스템(DTS)"
            backgroundColorType="primary"
            description={(
              <div className={styles.dndExperienceDescription}>
                <div className={styles.primary}>#협업 #네트워크</div>
                <div className={styles.title}>
                  {'모두와 커뮤니케이션 하며,\n협업하는 과정을 즐깁니다.'}
                </div>
                <div className={styles.description}>
                  DND만의 팀빌딩 방법으로 개발자와 디자이너간의 소통이 어렵지 않게 도와드립니다.
                  또한, 개발자와 개발자, 디자이너와 디자이너의 네트워킹 시간으로 다양한 시각을 넓힐 수 있어요!
                </div>
              </div>
            )}
          />
          <ImageCard
            fullWidth
            isReversed
            url="/assets/images/dnd-experience-02.png"
            alt="프로젝트 제작 가이드라인"
            backgroundColorType="secondary"
            description={(
              <div className={styles.dndExperienceDescription}>
                <div className={styles.secondary}>#커리큘럼 #멘토링 #서비스제작</div>
                <div className={styles.title}>
                  {'실무와 동일한 프로젝트\n제작 경험을 할 수 있습니다.'}
                </div>
                <div className={styles.description}>
                  매주 운영진의 모니터링 및 가이드라인을 제공합니다. 가이드라인에따라 퀄리티있는 프로젝트를 완성할 수 있습니다.
                </div>
              </div>
            )}
          />
          <ImageCard
            fullWidth
            url="/assets/images/dnd-experience-03.png"
            alt="다양한 교육 제공"
            backgroundColorType="tertiary"
            description={(
              <div className={styles.dndExperienceDescription}>
                <div className={styles.tertiary}>#이벤트 #운영진</div>
                <div className={styles.title}>
                  {'다양한 교육의 기회를\n통해 성장합니다.'}
                </div>
                <div className={styles.description}>
                  활동 중 내부 세미나 및 외부 세미나를 통해 프로젝트 제작 시 필요한 정보를 얻거나 커리어 코칭 피드백을 받을 수 있습니다.
                </div>
              </div>
            )}
          />
        </div>
      </SectionTitle>
      <GuidelineSection />
    </>
  );
}

export default AboutPage;
