import Image from 'next/image';
import Link from 'next/link';

import TopNavigationMenu from '../TopNavigationMenu';

import styles from './index.module.scss';

function TopNavigationBar() {
  return (
    <>
      <nav className={styles.navigationWrapper}>
        <div className={styles.navigationContents}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/logo-symbol.svg"
              alt="logo"
              width={32}
              height={36}
              priority
            />
          </Link>
          <TopNavigationMenu />
        </div>
      </nav>
      <div className={styles.space} />
    </>
  );
}

export default TopNavigationBar;
