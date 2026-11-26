import type { Review } from '@dnd-academy/core';
import clsx from 'clsx';
import Link from 'next/link';

import ResponsiveMasonry from '@/components/atoms/ResponsiveMasonry';
import SocialIconLink from '@/components/molecules/SocialIconLink';
import { RightArrowIcon } from '@/lib/assets/icons';
import { getEntries } from '@/utils';

import styles from './index.module.scss';

type Props = {
  reviews: Review[];
  hasProjectLink: boolean;
};

function ReviewList({ reviews, hasProjectLink }: Props) {
  return (
    <ResponsiveMasonry className={clsx(hasProjectLink && styles.hasProjectLink)}>
      {reviews.map((review) => (
        <ReviewCard key={review.id} value={review} hasProjectLink={hasProjectLink} />
      ))}
    </ResponsiveMasonry>
  );
}

export function ReviewCard({ value, hasProjectLink }: { value: Review; hasProjectLink: boolean }) {
  const { name, position, review, projectId, links } = value;
  return (
    <div className={styles.reviewCardWrapper}>
      <div className={styles.titleWrapper}>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.position}>{position}</div>
      </div>
      <div className={styles.review}>{review}</div>
      {Object.values(links).some((link) => !!link) && (
        <div className={styles.socialIconWrapper}>
          {getEntries(links).map(([key, link]) => (
            <SocialIconLink key={key} link={link} type={key} />
          ))}
        </div>
      )}
      {hasProjectLink && typeof projectId === 'number' && (
        <Link href={`/projects/${projectId}`} className={styles.link}>
          <span>프로젝트 보기</span>
          <RightArrowIcon className={styles.arrowIcon} width={20} height={20} />
        </Link>
      )}
    </div>
  );
}

export default ReviewList;
