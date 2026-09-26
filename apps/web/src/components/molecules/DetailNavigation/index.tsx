import clsx from 'clsx';
import { Route } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';

import { RightIcon } from '@/lib/assets/icons';

import styles from './index.module.scss';

type Props = {
  steps: {
    href?: Route;
    label: string;
  }[];
};

function DetailNavigation({ steps }: Props) {
  return (
    <nav className={styles.detailNavigation}>
      {steps.map(({ href, label }, index, array) => {
        if (href) {
          return (
            <Fragment key={label}>
              <Link href={href} className={styles.link}>
                {label}
              </Link>
              <RightIcon />
            </Fragment>
          );
        }

        return (
          <div key={label} className={clsx(styles.title, index === array.length - 1 && styles.lastItem)}>
            {label}
          </div>
        );
      })}
    </nav>
  );
}

export default DetailNavigation;
