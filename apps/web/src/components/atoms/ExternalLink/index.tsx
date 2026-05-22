import { AnchorHTMLAttributes, DetailedHTMLProps, PropsWithChildren } from 'react';

import clsx from 'clsx';

import styles from './index.module.scss';

interface Props extends Omit<
  DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
  'rel' | 'target' | 'href'
> {
  href: string;
  withTextUnderline?: boolean;
}

function ExternalLink({ href, className, children, withTextUnderline = true, ...rest }: PropsWithChildren<Props>) {
  return (
    <a
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      className={clsx(styles.externalLink, withTextUnderline && styles.textUnderline, className)}
      {...rest}
    >
      {children}
    </a>
  );
}

export default ExternalLink;
