import Marquee from 'react-fast-marquee';

import Image from 'next/image';

import SectionTitle from '@/components/atoms/SectionTitle';
import CounterCardSection from '@/components/molecules/CounterCardSection';

import styles from './index.module.scss';

function AboutPage() {
  return (
    <>
      <section className={styles.introduceSection}>
        <h1 className={styles.title}>소개</h1>
        <Marquee autoFill>
          <div className={styles.introduceImageWrapper}>
            {[1, 2, 3, 4, 5].map((order) => (
              <Image
                key={order}
                className={styles.image}
                src={`/assets/images/dnd-0${order}.png`}
                alt={`dnd-introduce-image-${order}`}
                sizes="100vw"
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
        DND에서 어떤 경험을 할 수 있을까요?
      </SectionTitle>
      <SectionTitle title="8주는 어떻게 진행되나요?">
        8주는 어떻게 진행되나요?
      </SectionTitle>
      <SectionTitle title="DND NEWS">
        DND NEWS
      </SectionTitle>
    </>
  );
}

export default AboutPage;
