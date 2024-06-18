import Image from 'next/image';
import Link from 'next/link';

import TopNavigationMenu from '../TopNavigationMenu';

import styles from './index.module.scss';

function TopNavigationBar() {
  return (
    <>
      <header className={styles.navigationWrapper}>
        <nav className={styles.navigationContents}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src={`${process.env.NEXT_PUBLIC_S3_HOST}/images/logo-symbol.svg`}
              alt="logo"
              width={32}
              height={36}
              priority
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
