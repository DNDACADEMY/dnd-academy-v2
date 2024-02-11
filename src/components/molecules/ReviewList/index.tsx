'use client';

import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import Link from 'next/link';

import ExternalLink from '@/components/atoms/ExternalLink';
import { ArrowRightIcon } from '@/lib/assets/icons';
import {
  EmailLogo, GithubLogo, HomeLogo, InstagramLogo, LinkedInLogo, MediumLogo, VelogLogo,
} from '@/lib/assets/logos';
import { Link as ReviewLink } from '@/lib/types/common';
import { Review } from '@/lib/types/review';

import styles from './index.module.scss';

type Props = {
  reviews: Review[];
};

function ReviewList({ reviews }: Props) {
  const reviewLinkIcon = (key: ReviewLink) => {
    const IconLogo = {
      link: HomeLogo,
      email: EmailLogo,
      github: GithubLogo,
      instagram: InstagramLogo,
      linkedin: LinkedInLogo,
      medium: MediumLogo,
      velog: VelogLogo,
    }[key] || HomeLogo;

    return <IconLogo className={styles.socialIcon} />;
  };

  return (
    <ResponsiveMasonry
      columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
    >
      <Masonry
        gutter="24px"
        className={styles.reviewsWrapper}
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
                  <ExternalLink key={key} href={link}>
                    {reviewLinkIcon(key as ReviewLink)}
                  </ExternalLink>
                ))}
              </div>
            )}
            {typeof projectId === 'number' && (
              <Link href={`/projects/${projectId}`} className={styles.link}>
                <span>프로젝트 보기</span>
                <ArrowRightIcon className={styles.icon} />
              </Link>
            )}
          </div>
        ))}
      </Masonry>
    </ResponsiveMasonry>
  );
}

export default ReviewList;
