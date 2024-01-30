import { AnchorHTMLAttributes, DetailedHTMLProps, PropsWithChildren } from 'react';

import clsx from 'clsx';

import styles from './index.module.scss';

interface Props
  extends Omit<
  DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
  'rel' | 'target' | 'href'
  > {
  href: string;
}

function ExternalLink({
  href, className, children, ...rest
}: PropsWithChildren<Props>) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <a href={href} rel="noopener noreferrer" target="_blank" className={clsx(styles.externalLink, className)} {...rest}>
      {children}
    </a>
  );
}

export default ExternalLink;
