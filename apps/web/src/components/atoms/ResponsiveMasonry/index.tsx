'use client';

import { PropsWithChildren } from 'react';
// TODO - 걷어내기
import Masonry, { ResponsiveMasonry as ReactResponsiveMasonry } from 'react-responsive-masonry';

import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  className?: string;
};

function ResponsiveMasonry({ children, className }: PropsWithChildren<Props>) {
  return (
    <ReactResponsiveMasonry
      columnsCountBreakPoints={{ 350: 1, 720: 2, 900: 3 }}
    >
      <Masonry
        gutter="24px"
        className={clsx(styles.wrapper, className)}
      >
        {children}
      </Masonry>
    </ReactResponsiveMasonry>
  );
}

export default ResponsiveMasonry;
