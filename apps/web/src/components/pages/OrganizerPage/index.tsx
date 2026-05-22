import Image from 'next/image';

import type { Organizer } from '@dnd-academy/core';
import { Button, SkillTag } from '@dnd-academy/ui';

import DetailNavigation from '@/components/molecules/DetailNavigation';
import LinkConverter from '@/components/molecules/LinkConverter';
import SocialIconLink from '@/components/molecules/SocialIconLink';
import ApplyNotifyButtonGroup from '@/components/organisms/ApplyNotifyButtonGroup';
import OrganizerCards from '@/components/organisms/OrganizerCards';
import { getEventStatus } from '@/lib/apis/event';
import { getOrganizers } from '@/lib/apis/organizer';
import { RightArrowIcon } from '@/lib/assets/icons';
import { getEntries } from '@/utils';

import styles from './index.module.scss';

type Props = {
  organizer: Organizer;
};

function OrganizerPage({ organizer }: Props) {
  const eventStatus = getEventStatus();

  const isMascot = organizer.dndPosition === '마스코트';

  const samePositionOrganizers = getOrganizers({
    position: isMascot ? undefined : organizer.dndPosition,
    isArchived: false,
  }).filter((samePositionOrganizer) => samePositionOrganizer.id !== organizer.id);

  return (
    <>
      <DetailNavigation
        steps={[
          {
            label: 'DND',
            href: '/dnd/about',
          },
          {
            label: '운영진',
            href: '/organizers',
          },
          {
            label: organizer.name,
          },
        ]}
      />
      <div className={styles.organizerPage}>
        <div className={styles.organizerMainContents}>
          <aside>
            <div className={styles.organizerInfoWrapper}>
              <div className={styles.thumbnailWrapper}>
                {!organizer?.thumbnail || organizer?.emoji ? (
                  <span className={styles.emoji}>{organizer.emoji}</span>
                ) : (
                  <Image
                    src={organizer.thumbnail}
                    alt={organizer.name}
                    className={styles.thumbnail}
                    width="0"
                    height="0"
                    sizes="(max-width: 1204px) 50vw, 33vw"
                    priority
                  />
                )}
              </div>
              <div className={styles.organizerInfo}>
                <div className={styles.position}>{organizer.dndPosition}</div>
                <div className={styles.name}>{organizer.name}</div>
                <div className={styles.skillWrapper}>
                  {organizer.technicalStack.map((stack) => (
                    <SkillTag key={stack} color="dark" skill={stack} />
                  ))}
                </div>
                <div className={styles.socialIconWrapper}>
                  {getEntries(organizer.links).map(([key, link]) => (
                    <SocialIconLink key={key} link={link} type={key} />
                  ))}
                </div>
              </div>
            </div>
          </aside>
          <div className={styles.divider} />
          <section className={styles.organizerDescription}>
            <h1>{organizer.oneLineIntroduction}</h1>
            <div className={styles.organizerDescriptionItem}>
              <h2>👏MBTI</h2>
              <div>{organizer.mbti}</div>
            </div>
            <div className={styles.organizerDescriptionItem}>
              <h2>이력</h2>
              <div>
                {organizer.career.now.map((nowCareer) => (
                  <div key={nowCareer}>{`👉 현) ${nowCareer}`}</div>
                ))}
                {organizer.career.previous.map((previousCareer) => (
                  <div key={previousCareer}>{`👉 전) ${previousCareer}`}</div>
                ))}
              </div>
            </div>
            <div className={styles.organizerDescriptionItem}>
              <h2>DND에서 어떤 업무를 맡고 있으신가요?</h2>
              <LinkConverter
                elementType="p"
                text={organizer.questions.whatIsYourRoleInDnd}
                className={styles.organizerAnswer}
              />
            </div>
            <div className={styles.organizerDescriptionItem}>
              <h2>지원자들에게 DND를 왜 추천하나요?</h2>
              <div className={styles.organizerAnswer}>
                <LinkConverter
                  elementType="p"
                  text={organizer.questions.whyDoYouRecommendDnd}
                  className={styles.organizerAnswer}
                />
              </div>
              <ApplyNotifyButtonGroup eventStatus={eventStatus}>
                <Button isAnimated={false} className={styles.applyButton}>
                  <RightArrowIcon className={styles.arrowIcon} width={20} height={20} />
                </Button>
              </ApplyNotifyButtonGroup>
            </div>
            <div className={styles.organizerDescriptionItem}>
              <h2>
                <strong className={styles.bold}>{organizer.name}</strong>
                님이 관심있고, 행복해하는 것은?
              </h2>
              <LinkConverter
                elementType="p"
                text={organizer.questions.whatIsYourInterests}
                className={styles.organizerAnswer}
              />
            </div>
            {organizer.questions.whatYouWantToShare.length > 0 && (
              <div className={styles.shareImageWrapper}>
                {organizer.questions.whatYouWantToShare.map((share, index) => (
                  <Image
                    key={share}
                    src={share}
                    width={202}
                    height={202}
                    alt={`공유이미지-${index}`}
                    className={styles.shareImage}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
        <div className={styles.samePositionOrganizersWrapper}>
          <h3>운영진 더보기</h3>
          <OrganizerCards organizers={samePositionOrganizers} />
        </div>
      </div>
    </>
  );
}

export default OrganizerPage;
