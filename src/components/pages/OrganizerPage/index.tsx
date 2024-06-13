import Image from 'next/image';

import DetailNavigation from '@/components/atoms/DetailNavigation';
import SkillTag from '@/components/atoms/SkillTag';
import OrganizerCard from '@/components/molecules/OrganizerCard';
import SocialIconLink from '@/components/molecules/SocialIconLink';
import ApplyModal from '@/components/organisms/ApplyModal';
import { getOrganizers } from '@/lib/apis/organizer';
import { RightArrowIcon } from '@/lib/assets/icons';
import { Organizer } from '@/lib/types/organizer';
import { getEntries } from '@/utils';

import styles from './index.module.scss';

type Props = {
  organizer: Organizer;
};

function OrganizerPage({ organizer }: Props) {
  const samePositionOrganizers = getOrganizers({
    position: organizer.dndPosition,
    isArchived: false,
  });

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
                {organizer?.emoji ? <span className={styles.emoji}>{organizer.emoji}</span> : (
                  <Image
                    src={organizer.picture}
                    alt={organizer.name}
                    className={styles.thumbnail}
                    width={223}
                    height={223}
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
              <div className={styles.organizerAnswer}>
                {organizer.questions.whatIsYourRoleInDnd}
              </div>
            </div>
            <div className={styles.organizerDescriptionItem}>
              <h2>지원자들에게 DND를 왜 추천하나요?</h2>
              <div className={styles.organizerAnswer}>
                {organizer.questions.whyDoYouRecommendDnd}
              </div>
              <ApplyModal>
                <button type="button" className={styles.applyButton}>
                  <RightArrowIcon className={styles.arrowIcon} width={20} height={20} />
                </button>
              </ApplyModal>
            </div>
            <div className={styles.organizerDescriptionItem}>
              <h2>
                <strong className={styles.bold}>{organizer.name}</strong>
                님이 관심있고, 행복해하는 것은?
              </h2>
              <div className={styles.organizerAnswer}>
                {organizer.questions.whatIsYourInterests}
              </div>
            </div>
            <div className={styles.shareImageWrapper}>
              {organizer.questions.whatYouWantToShare.map((share, index) => (
                <Image key={share} src={share} width={202} height={202} alt={`공유이미지-${index}`} className={styles.shareImage} />
              ))}
            </div>
          </section>
        </div>
        <div className={styles.samePositionOrganizersWrapper}>
          <h3>운영진 더보기</h3>
          <div className={styles.samePositionOrganizers}>
            {samePositionOrganizers.map(({
              id, dndPosition, name, technicalStack, oneLineIntroduction, picture, emoji,
            }) => (
              <OrganizerCard
                key={id}
                id={id}
                position={dndPosition}
                name={name}
                technicalStack={technicalStack}
                oneLineIntroduction={oneLineIntroduction}
                profile={picture}
                emoji={emoji}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default OrganizerPage;
