import { FunctionComponent, SVGAttributes } from 'react';

import ExternalLink from '@/components/atoms/ExternalLink';
import {
  EmailLogo,
  FacebookLogo,
  GithubLogo,
  HomeLogo,
  InstagramLogo,
  LinkedInLogo,
  MediumLogo,
  NaverLogo,
  TistoryLogo,
  VelogLogo,
} from '@/lib/assets/logos';
import { LogoType } from '@/lib/types/common';

import styles from './index.module.scss';

type Props = {
  type: LogoType;
  link?: string;
  className?: string;
};

function SocialIconLink({ link, type, className }: Props) {
  const IconLogo = ({
    link: HomeLogo,
    email: EmailLogo,
    github: GithubLogo,
    instagram: InstagramLogo,
    linkedin: LinkedInLogo,
    medium: MediumLogo,
    velog: VelogLogo,
    facebook: FacebookLogo,
    naverBlog: NaverLogo,
    tistory: TistoryLogo,
  } as Partial<Record<LogoType, FunctionComponent<SVGAttributes<SVGElement>>>>);

  const Logo = IconLogo[type] || HomeLogo;

  if (!link) {
    return <Logo className={styles.socialIcon} />;
  }

  return (
    <ExternalLink href={link} className={className}>
      <Logo className={styles.socialIcon} />
    </ExternalLink>
  );
}

export default SocialIconLink;
