'use client';

/* eslint-disable react/jsx-props-no-spreading */
import {
  HTMLProps, ReactElement, ReactNode, useMemo,
} from 'react';

import Link from 'next/link';

import clsx from 'clsx';
import { motion } from 'framer-motion';

import styles from './index.module.scss';

export type ButtonSize = 'xLarge' | 'large' | 'medium' | 'small';
type ButtonType = 'default' | 'primary' | 'secondary' | 'clear' | 'purple';

export interface ButtonProps extends Omit<HTMLProps<HTMLButtonElement | HTMLAnchorElement>, 'size'> {
  buttonType?: ButtonType;
  size?: ButtonSize;
  width?: string;
  type?: 'submit' | 'reset' | 'button';
  /** NOTE - light는 디자인 시스템 정의가 안되어있어서 clear button만 적용 */
  theme?: 'light' | 'dark';
  fullWidth?: boolean;
  rounded?: boolean;
  isExternalLink?: boolean;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
}

function Button({
  href,
  size = 'medium',
  type = 'button',
  rounded = false,
  disabled,
  width,
  isExternalLink,
  theme = 'dark',
  buttonType = 'default',
  suffixIcon,
  prefixIcon,
  fullWidth,
  icon,
  className,
  children,
  ...rest
}: ButtonProps): ReactElement {
  const htmlProps = rest as any;

  const buttonClassName = clsx(
    styles.buttonWrapper,
    styles[theme],
    styles[size],
    styles[buttonType],
    {
      [styles.fullWidth]: fullWidth,
      [styles.disabled]: disabled,
      [styles.onlyIcon]: !!icon,
      [styles.hasWidth]: !!width,
      [styles.rounded]: rounded,
    },
    className,
  );

  const buttonLabel = useMemo(() => {
    if (icon) {
      return icon;
    }

    if (suffixIcon) {
      return (
        <>
          <span>{children}</span>
          {suffixIcon}
        </>
      );
    }

    if (prefixIcon) {
      return (
        <>
          {prefixIcon}
          <span>{children}</span>
        </>
      );
    }

    return children;
  }, [suffixIcon, prefixIcon, children, icon]);

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
    <motion.button
      // eslint-disable-next-line react/button-has-type
      type={type}
      whileHover={!disabled && { scale: 1.02 }}
      whileTap={!disabled && { scale: 0.98 }}
      className={buttonClassName}
      disabled={disabled}
      aria-disabled={disabled}
      style={{
        width,
      }}
      {...htmlProps}
    >
      {buttonLabel}
    </motion.button>
  );
}

export default Button;
