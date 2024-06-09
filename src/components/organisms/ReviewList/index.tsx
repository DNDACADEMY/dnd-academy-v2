'use client';

import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import Link from 'next/link';

import clsx from 'clsx';

import SocialIconLink from '@/components/molecules/SocialIconLink';
import { RightArrowIcon } from '@/lib/assets/icons';
import { LogoType } from '@/lib/types/common';
import { Review } from '@/lib/types/review';

import styles from './index.module.scss';

type Props = {
  reviews: Review[];
  hasProjectLink: boolean;
};

function ReviewList({ reviews, hasProjectLink }: Props) {
  return (
    <ResponsiveMasonry
      columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
    >
      <Masonry
        gutter="24px"
        className={clsx(hasProjectLink && styles.reviewsWrapper)}
      >
        {reviews.map(({
          id, name, position, review, projectId, links,
        }) => (
          <div key={id} className={styles.reviewCardWrapper}>
            <div className={styles.titleWrapper}>
              <h3 className={styles.name}>{name}</h3>
              <div className={styles.position}>{position}</div>
            </div>
            <div className={styles.review}>{review}</div>
            {Object.values(links).some((link) => !!link) && (
              <div className={styles.socialIconWrapper}>
                {Object.entries(links).filter(([, link]) => !!link).map(([key, link]) => (
                  <SocialIconLink key={key} link={link} type={key as LogoType} />
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
        ))}
      </Masonry>
    </ResponsiveMasonry>
  );
}

export default ReviewList;
