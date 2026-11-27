import type { Organizer } from '@dnd-academy/core';
import Image from 'next/image';
import type { ReactNode } from 'react';

import TechnologyTag from '@/components/atoms/TechnologyTag';
import LinkConverter from '@/components/molecules/LinkConverter';
import SocialIconLink from '@/components/molecules/SocialIconLink';
import { getEntries } from '@/utils';

import styles from './index.module.scss';

export default function OrganizerDetails({
  organizer,
  application,
  preview = false,
}: {
  organizer: Organizer;
  application?: ReactNode;
  preview?: boolean;
}) {
  return (
    <div className={styles.organizerMainContents}>
      <aside>
        <div className={styles.organizerInfoWrapper}>
          {(!preview || organizer.emoji || organizer.thumbnail) && (
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
          )}
          <div className={styles.organizerInfo}>
            <div className={styles.position}>{organizer.dndPosition}</div>
            <div className={styles.name}>{organizer.name}</div>
            <div className={styles.skillWrapper}>
              {organizer.technicalStack.map((stack) => (
                <TechnologyTag key={stack} color="dark" skill={stack} />
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
        {(!preview || organizer.oneLineIntroduction.trim()) && <h1>{organizer.oneLineIntroduction}</h1>}
        {(!preview || organizer.mbti.trim()) && (
          <div className={styles.organizerDescriptionItem}>
            <h2>👏MBTI</h2>
            <div>{organizer.mbti}</div>
          </div>
        )}
        {(!preview || organizer.career.now.length > 0 || organizer.career.previous.length > 0) && (
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
        )}
        {(!preview || organizer.questions.whatIsYourRoleInDnd.trim()) && (
          <div className={styles.organizerDescriptionItem}>
            <h2>DND에서 어떤 업무를 맡고 있으신가요?</h2>
            <LinkConverter
              elementType="p"
              text={organizer.questions.whatIsYourRoleInDnd}
              className={styles.organizerAnswer}
            />
          </div>
        )}
        {(!preview || organizer.questions.whyDoYouRecommendDnd.trim() || application) && (
          <div className={styles.organizerDescriptionItem}>
            <h2>지원자들에게 DND를 왜 추천하나요?</h2>
            <div className={styles.organizerAnswer}>
              <LinkConverter
                elementType="p"
                text={organizer.questions.whyDoYouRecommendDnd}
                className={styles.organizerAnswer}
              />
            </div>
            {application}
          </div>
        )}
        {(!preview || organizer.questions.whatIsYourInterests.trim()) && (
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
        )}
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
  );
}
