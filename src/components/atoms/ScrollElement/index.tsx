'use client';

import {
  createElement, JSX, useEffect, useRef,
} from 'react';

import clsx from 'clsx';

import styles from './index.module.scss';

type Props<ElementType extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[ElementType] & {
    elementType?: keyof JSX.IntrinsicElements;
    activeParam: string;
    targetParam?: string;
    scrollIntoViewOptions?: ScrollIntoViewOptions;
  };

function ScrollElement<E extends keyof JSX.IntrinsicElements>({
  elementType = 'div', activeParam, children, className, targetParam, scrollIntoViewOptions, ...props
}: Props<E>) {
  const containerRef = useRef<Element>(null);

  useEffect(() => {
    if (targetParam === activeParam) {
      containerRef.current?.scrollIntoView(scrollIntoViewOptions);
    }
  }, [targetParam, activeParam, scrollIntoViewOptions]);

  return (
    createElement(
      elementType,
      {
        ...props,
        ref: containerRef,
        className: clsx(styles.scrollElementWrapper, className),
      },
      children,
    )
  );
}

export default ScrollElement;
