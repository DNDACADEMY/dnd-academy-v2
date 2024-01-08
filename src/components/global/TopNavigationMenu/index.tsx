'use client';

import { useState } from 'react';

import { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import clsx from 'clsx';

import styles from './index.module.scss';

function TopNavigationMenu() {
  const pathname = usePathname() as Route;

  const [isVisibleSubNav, setIsVisibleSubNav] = useState<boolean>(false);

  const isDNDPathname = ['/dnd/about', '/dnd/culture'].includes(pathname);

  const isActivePathname = (targetPathname: Route) => targetPathname === pathname;

  return (
    <ul className={styles.topNavigationMenuWrapper}>
      <li>
        <Link href="/" className={clsx(isActivePathname('/') && styles.active)}>
          홈
        </Link>
      </li>
      <li>
        <Link href="/projects" className={clsx(isActivePathname('/projects') && styles.active)}>
          프로젝트
        </Link>
      </li>
      <li
        className={styles.aboutNavItem}
        onMouseEnter={() => setIsVisibleSubNav(true)}
        onMouseLeave={() => setIsVisibleSubNav(false)}
      >
        <Link
          href="/dnd/about"
          className={clsx(isDNDPathname && styles.active)}
        >
          DND
        </Link>
        {(isVisibleSubNav || isDNDPathname) && (
          <ul className={styles.subNav}>
            <li>
              <Link href="/dnd/about" className={clsx(styles.subNavItem, isActivePathname('/dnd/about') && styles.activeSub)}>
                소개
              </Link>
            </li>
            <li>
              <Link href="/dnd/culture" className={clsx(styles.subNavItem, isActivePathname('/dnd/culture') && styles.activeSub)}>
                문화
              </Link>
            </li>
          </ul>
        )}
      </li>
      <li>
        <Link href="/reviews" className={clsx(isActivePathname('/reviews') && styles.active)}>
          후기
        </Link>
      </li>
      <li>
        <Link href="/blog" className={clsx(isActivePathname('/blog') && styles.active)}>
          블로그
        </Link>
      </li>
      <li>
        <Link href="/jobs" className={clsx(isActivePathname('/jobs') && styles.active)}>
          채용
        </Link>
      </li>
    </ul>
  );
}

export default TopNavigationMenu;
