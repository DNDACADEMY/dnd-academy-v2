import Link from 'next/link';

import Button from '@/components/atoms/Button';
import ExternalLink from '@/components/atoms/ExternalLink';
import {
  FacebookLogo, GithubLogo, InstagramLogo, LinkedInLogo, YoutubeLogo,
} from '@/lib/assets/logos';

import styles from './index.module.scss';

function Footer() {
  return (
    <footer className={styles.footerWrapper}>
      <div className={styles.footerContentsWrapper}>
        <div className={styles.leftContents}>
          <h3 className={styles.title}>DND</h3>
          <div className={styles.linkWrapper}>
            <ExternalLink href="https://www.facebook.com/DNDACADEMY" className={styles.iconLink}>
              <FacebookLogo />
            </ExternalLink>
            <ExternalLink href="https://www.linkedin.com/company/dndacademy/?viewAsMember=true" className={styles.iconLink}>
              <LinkedInLogo />
            </ExternalLink>
            <ExternalLink href="https://www.instagram.com/dnd.ac?utm_medium=copy_link" className={styles.iconLink}>
              <InstagramLogo />
            </ExternalLink>
            <ExternalLink href="https://www.youtube.com/channel/UCLzVjG8j1m4X8TSpMF-x5yw" className={styles.iconLink}>
              <YoutubeLogo />
            </ExternalLink>
            <ExternalLink href="https://github.com/dnd-side-project" className={styles.iconLink}>
              <GithubLogo />
            </ExternalLink>
            <ExternalLink href="https://island-allium-288.notion.site/DND-53511a46df7748899e8ed079ca0eee85?pvs=4" className={styles.link}>
              DND활동 정책
            </ExternalLink>
          </div>
        </div>
        <div className={styles.rightContents}>
          <ul className={styles.menuList}>
            <li><Link href="/">홈</Link></li>
            <li><Link href="/projects">프로젝트</Link></li>
            <li><Link href="/organizers">운영진</Link></li>
            <li className={styles.menu}>
              <Link href="/dnd/about">DND</Link>
              <ul className={styles.subMenu}>
                <li><Link href="/dnd/about" className={styles.link}>소개</Link></li>
                <li><Link href="/dnd/culture" className={styles.link}>문화</Link></li>
              </ul>
            </li>
            <li><Link href="/reviews">후기</Link></li>
            <li><ExternalLink href="https://blog.dnd.ac">블로그</ExternalLink></li>
          </ul>
          <Button type="button" buttonType="primary">알림 신청하기</Button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
