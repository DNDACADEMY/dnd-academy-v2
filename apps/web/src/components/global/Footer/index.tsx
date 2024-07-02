import Link from 'next/link';

import Button from '@/components/atoms/Button';
import ExternalLink from '@/components/atoms/ExternalLink';
import SocialIconLink from '@/components/molecules/SocialIconLink';
import ApplyNotifyButtonGroup from '@/components/organisms/ApplyNotifyButtonGroup';
import { getEventStatus } from '@/lib/apis/event';
import { LogoType } from '@/lib/types/common';

import styles from './index.module.scss';

const footerLinks: { link: string; logo: LogoType; }[] = [
  { link: 'https://www.facebook.com/DNDACADEMY', logo: 'facebook' },
  { link: 'https://www.linkedin.com/company/dndacademy/?viewAsMember=true', logo: 'linkedin' },
  { link: 'https://www.instagram.com/dnd.ac?utm_medium=copy_link', logo: 'instagram' },
  { link: 'https://www.youtube.com/channel/UCLzVjG8j1m4X8TSpMF-x5yw', logo: 'youtube' },
  { link: 'https://github.com/dnd-side-project', logo: 'github' },
];

function Footer() {
  const eventStatus = getEventStatus();

  return (
    <footer className={styles.footerWrapper}>
      <div className={styles.footerContentsWrapper}>
        <div className={styles.topContents}>
          <h3 className={styles.title}>DND</h3>
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
            {/* NOTE - 블로그 가리기 */}
            {/* <li><ExternalLink href="https://blog.dnd.ac">블로그</ExternalLink></li> */}
          </ul>
        </div>
        <div className={styles.bottomContents}>
          <div className={styles.linkWrapper}>
            {footerLinks.map(({ link, logo }) => (
              <SocialIconLink key={link} link={link} type={logo} />
            ))}
            <ExternalLink href="https://island-allium-288.notion.site/DND-53511a46df7748899e8ed079ca0eee85?pvs=4" className={styles.link}>
              DND활동 정책
            </ExternalLink>
          </div>
          <ApplyNotifyButtonGroup eventStatus={eventStatus}>
            <Button buttonType="primary" />
          </ApplyNotifyButtonGroup>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
