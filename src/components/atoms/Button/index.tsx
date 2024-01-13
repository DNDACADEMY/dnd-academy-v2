'use client';

/* eslint-disable react/jsx-props-no-spreading */
import {
  HTMLProps, PropsWithChildren, ReactElement, ReactNode, useMemo,
} from 'react';

import Link from 'next/link';

import clsx from 'clsx';

import styles from './index.module.scss';

type ButtonSize = 'xLarge' | 'large' | 'medium' | 'small';
type ButtonType = 'primary' | 'secondary' | 'clear';

interface Props extends Omit<HTMLProps<HTMLButtonElement | HTMLAnchorElement>, 'size'> {
  buttonType?: ButtonType;
  size?: ButtonSize;
  width?: string;
  type?: 'submit' | 'reset' | 'button';
  isExternalLink?: boolean;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
}

function Button({
  href,
  size = 'medium',
  type = 'button',
  disabled,
  width,
  isExternalLink,
  buttonType = 'primary',
  suffixIcon,
  prefixIcon,
  className,
  children,
  ...rest
}: PropsWithChildren<Props>): ReactElement {
  const htmlProps = rest as any;

  const buttonClassName = clsx(styles.buttonWrapper, {
    [styles[size]]: size,
    [styles[buttonType]]: buttonType,
    [styles.disabled]: disabled,
  }, className);

  const buttonLabel = useMemo(() => {
    if (suffixIcon) {
      return (
        <>
          {suffixIcon}
          <span>{children}</span>
        </>
      );
    }

    if (prefixIcon) {
      return (
        <>
          <span>{children}</span>
          {prefixIcon}
        </>
      );
    }

    return children;
  }, [suffixIcon, prefixIcon, children]);

  if (href) {
    return (
      <Link
        href={href}
        rel={isExternalLink ? 'noopener noreferrer' : undefined}
        target={isExternalLink ? '_blank' : undefined}
        className={buttonClassName}
        aria-disabled={disabled}
        style={{
          width,
        }}
        {...htmlProps}
      >
        {buttonLabel}
      </Link>
    );
  }

  return (
    <button
      // eslint-disable-next-line react/button-has-type
      type={type}
      className={buttonClassName}
      disabled={disabled}
      aria-disabled={disabled}
      style={{
        width,
      }}
      {...htmlProps}
    >
      {buttonLabel}
    </button>
  );
}

export default Button;
