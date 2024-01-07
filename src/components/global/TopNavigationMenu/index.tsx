'use client';

import { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import clsx from 'clsx';

import styles from './index.module.scss';

function TopNavigationMenu() {
  const pathname = usePathname() as Route;

  return (
    <ul className={styles.topNavigationMenuWrapper}>
      <li>
        <Link href="/" className={clsx(pathname === '/' && styles.active)}>
          홈
        </Link>
      </li>
      <li>
        <Link href="/projects" className={clsx(pathname === '/projects' && styles.active)}>
          프로젝트
        </Link>
      </li>
      <li>
        {/* TODO - sub navigation으로 변경 */}
        <Link href="/dnd/about" className={clsx(pathname === '/dnd/about' && styles.active)}>
          DND
        </Link>
      </li>
      <li>
        <Link href="/reviews" className={clsx(pathname === '/reviews' && styles.active)}>
          후기
        </Link>
      </li>
      <li>
        <Link href="/blog" className={clsx(pathname === '/blog' && styles.active)}>
          블로그
        </Link>
      </li>
      <li>
        <Link href="/jobs" className={clsx(pathname === '/jobs' && styles.active)}>
          채용
        </Link>
      </li>
    </ul>
  );
}

export default TopNavigationMenu;
