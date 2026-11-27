import { type LogoType } from '@dnd-academy/core';
import clsx from 'clsx';
import { FunctionComponent, SVGAttributes } from 'react';

import ExternalLink from '@/components/atoms/ExternalLink';
import {
  AppStoreLogo,
  EmailLogo,
  FacebookLogo,
  FigmaLogo,
  GithubLogo,
  GooglePlayStoreLogo,
  HomeLogo,
  InstagramLogo,
  LinkedInLogo,
  MediumLogo,
  NaverLogo,
  TistoryLogo,
  VelogLogo,
  YoutubeLogo,
} from '@/lib/assets/logos';

import styles from './index.module.scss';

type Props = {
  type: LogoType;
  link?: string;
  className?: string;
  theme?: 'light' | 'dark';
};

function SocialIconLink({ link, type, className, theme = 'dark' }: Props) {
  const IconLogo = {
    link: HomeLogo,
    blog: HomeLogo,
    email: EmailLogo,
    github: GithubLogo,
    instagram: InstagramLogo,
    linkedin: LinkedInLogo,
    medium: MediumLogo,
    velog: VelogLogo,
    facebook: FacebookLogo,
    naverBlog: NaverLogo,
    tistory: TistoryLogo,
    appStore: AppStoreLogo,
    googlePlayStore: GooglePlayStoreLogo,
    figma: FigmaLogo,
    youtube: YoutubeLogo,
  } as Partial<Record<LogoType, FunctionComponent<SVGAttributes<SVGElement>>>>;

  const Logo = IconLogo[type] || HomeLogo;

  const logoClassName = clsx(styles.socialIcon, {
    [styles[theme]]: theme,
  });

  const label = type === 'blog' ? '개인 블로그' : type;

  if (!link) {
    return <Logo className={logoClassName} aria-label={label} />;
  }

  return (
    <ExternalLink href={link} className={className} aria-label={label}>
      <Logo className={logoClassName} aria-hidden="true" />
    </ExternalLink>
  );
}

export default SocialIconLink;
