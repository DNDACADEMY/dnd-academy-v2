'use client';

import {
  createElement, JSX, useEffect, useRef,
} from 'react';

import { useSearchParams } from 'next/navigation';

import clsx from 'clsx';

import styles from './index.module.scss';

type Props<ElementType extends keyof JSX.IntrinsicElements> =
  JSX.IntrinsicElements[ElementType] & {
    elementType?: keyof JSX.IntrinsicElements;
    paramKey: string;
    scrollIntoViewOptions?: ScrollIntoViewOptions;
  };

function ScrollElement<E extends keyof JSX.IntrinsicElements>({
  elementType = 'div', paramKey, children, className, scrollIntoViewOptions, ...props
}: Props<E>) {
  const searchParams = useSearchParams();
  const containerRef = useRef<Element>(null);

  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === paramKey) {
      containerRef.current?.scrollIntoView(scrollIntoViewOptions);
    }
  }, [tabParam, paramKey, scrollIntoViewOptions]);

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
