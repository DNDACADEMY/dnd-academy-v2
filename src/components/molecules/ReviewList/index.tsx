'use client';

import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import Link from 'next/link';

import { Review } from '@/lib/types/review';

import styles from './index.module.scss';

type Props = {
  reviews: Review[];
};

function ReviewList({ reviews }: Props) {
  return (
    <ResponsiveMasonry
      columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
    >
      <Masonry
        gutter="24px"
        className={styles.reviewsWrapper}
      >
        {reviews.map(({
          id, name, position, review, projectId,
        }) => (
          <div key={id} className={styles.reviewCardWrapper}>
            <div>
              <h3>{name}</h3>
              <div>{position}</div>
            </div>
            <div>{review}</div>
            {projectId && (
            <Link href={`/projects/${projectId}`}>프로젝트 보기</Link>
            )}
          </div>
        ))}
      </Masonry>
    </ResponsiveMasonry>
  );
}

export default ReviewList;
