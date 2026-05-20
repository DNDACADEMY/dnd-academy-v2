'use client';
import {
  AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLProps, ReactElement, ReactNode, useMemo,
} from 'react';

import Link from 'next/link';

import clsx from 'clsx';
import { motion, type MotionProps } from 'motion/react';

import styles from './index.module.scss';

export type ButtonSize = 'xLarge' | 'large' | 'medium' | 'small';
type ButtonType = 'default' | 'primary' | 'secondary' | 'clear' | 'purple';

export interface ButtonProps extends Omit<HTMLProps<HTMLButtonElement | HTMLAnchorElement>, 'size' | 'type'> {
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
  isAnimated?: boolean;
}

type AnchorHtmlProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof MotionProps | 'href' | 'size' | 'type'>;
type ButtonHtmlProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps | 'size' | 'type'>;

const MotionLink = motion.create(Link);

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
  isAnimated = true,
  className,
  children,
  ...rest
}: ButtonProps): ReactElement {
  const anchorHtmlProps = rest as AnchorHtmlProps;
  const buttonHtmlProps = rest as ButtonHtmlProps;

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

  const isMotion = isAnimated && !disabled;

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
      <MotionLink
        href={href}
        whileHover={isMotion ? { scale: 1.02 } : undefined}
        whileTap={isMotion ? { scale: 0.98 } : undefined}
        rel={isExternalLink ? 'noopener noreferrer' : undefined}
        target={isExternalLink ? '_blank' : undefined}
        className={buttonClassName}
        aria-disabled={disabled}
        style={{
          width,
        }}
        {...anchorHtmlProps}
      >
        {buttonLabel}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      whileHover={isMotion ? { scale: 1.02 } : undefined}
      whileTap={isMotion ? { scale: 0.98 } : undefined}
      className={buttonClassName}
      disabled={disabled}
      aria-disabled={disabled}
      style={{
        width,
      }}
      {...buttonHtmlProps}
    >
      {buttonLabel}
    </motion.button>
  );
}

export default Button;
