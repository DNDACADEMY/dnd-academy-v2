import Link from 'next/link';

import { DNDLogo } from '@/lib/assets/logos';

import TopNavigationMenu from '../TopNavigationMenu';

import styles from './index.module.scss';

function TopNavigationBar() {
  return (
    <>
      <header className={styles.navigationWrapper}>
        <nav className={styles.navigationContents}>
          <Link href="/" className={styles.logoLink}>
            <DNDLogo
              aria-label="logo"
              width={21}
              height={24}
              className={styles.logo}
            />
          </Link>
          <TopNavigationMenu />
        </nav>
      </header>
      <div className={styles.space} />
    </>
  );
}

export default TopNavigationBar;
