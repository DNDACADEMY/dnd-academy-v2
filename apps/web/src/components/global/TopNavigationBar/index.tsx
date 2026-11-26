import Link from 'next/link';

import { DNDChristmasLogo, DNDLogo } from '@/lib/assets/logos';
import { isChristmasTheme } from '@/utils';

import TopNavigationMenu from '../TopNavigationMenu';

import styles from './index.module.scss';

function TopNavigationBar() {
  return (
    <>
      <header className={styles.navigationWrapper} data-public-chrome>
        <nav className={styles.navigationContents}>
          <Link href="/" className={styles.logoLink}>
            {isChristmasTheme() ? (
              <DNDChristmasLogo aria-label="logo" className={styles.christmasLogo} />
            ) : (
              <DNDLogo aria-label="logo" className={styles.logo} />
            )}
          </Link>
          <TopNavigationMenu />
        </nav>
      </header>
      <div className={styles.space} data-public-chrome />
    </>
  );
}

export default TopNavigationBar;
