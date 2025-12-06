import Image from 'next/image';

import { Button } from '@dnd-academy/ui';

import ExternalLink from '@/components/atoms/ExternalLink';
import SectionTitle from '@/components/atoms/SectionTitle';
import { LinkIcon } from '@/lib/assets/icons';

import styles from './index.module.scss';

function SponsorSection() {
  const sponsors = [
    { sponsor: 'wanted', url: 'https://www.wanted.co.kr', image: 'wanted.png' },
    { sponsor: 'naver-d2', url: 'https://d2.naver.com', image: 'naver-d2.png' },
    { sponsor: 'hanbit', url: 'https://www.hanbit.co.kr', image: 'hanbit.png' },
    { sponsor: 'easys-publishing', url: 'http://www.easyspub.co.kr', image: 'easys-publishing.png' },
    { sponsor: 'witi', url: '#', image: 'witi.png' },
    { sponsor: 'asan-nanum', url: 'https://asan-nanum.org', image: 'asan-nanum.png' },
    { sponsor: 'impact-campus', url: 'https://impactcampus.campaignus.me', image: 'impact-campus.png' },
    { sponsor: 'notefolio', url: 'https://notefolio.net', image: 'notefolio.png' },
    { sponsor: 'elice', url: 'https://elice.io/ko', image: 'elice.png' },
    { sponsor: 'sniperfactory', url: 'https://sniperfactory.com', image: 'sniperfactory.png' },
    { sponsor: 'zighang', url: 'https://zighang.com', image: 'zighang.png' },
    { sponsor: 'f-lab', url: 'https://f-lab.kr', image: 'f-lab.png' },
  ];

  return (
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
        {sponsors.map(({ sponsor, url, image }) => (
          <ExternalLink key={sponsor} href={url} className={styles.sponsor}>
            <Image
              src={`/assets/logos/sponsors/${image}`}
              alt={sponsor}
              fill
              sizes="(max-width: 1204px) 50vw, 33vw"
              className={styles.sponsorImage}
            />
          </ExternalLink>
        ))}
      </div>
      <Button
        isExternalLink
        href="https://island-allium-288.notion.site/2e120a6a87814c9493a2493b029137a4?pvs=4"
        buttonType="clear"
        size="large"
        suffixIcon={<LinkIcon width={14} height={14} className={styles.linkIcon} />}
      >
        후원 문의하기
      </Button>
    </SectionTitle>
  );
}

export default SponsorSection;
