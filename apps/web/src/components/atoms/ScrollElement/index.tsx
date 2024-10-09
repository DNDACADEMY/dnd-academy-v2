'use client';

import {
  ComponentProps,
  createElement,
  ElementType,
  useEffect,
  useRef,
} from 'react';

import clsx from 'clsx';

import styles from './index.module.scss';

type ScrollElementProps<E extends ElementType> = {
  elementType?: E;
  activeParam: string;
  targetParam?: string;
  scrollIntoViewOptions?: ScrollIntoViewOptions;
};

type Props<E extends ElementType> =
  ScrollElementProps<E> & Omit<ComponentProps<E>, keyof ScrollElementProps<E>>;

function ScrollElement<E extends ElementType>({
  elementType, activeParam, children, className, targetParam, scrollIntoViewOptions, ...props
}: Props<E>) {
  const containerRef = useRef<Element>(null);

  useEffect(() => {
    if (targetParam === activeParam) {
      containerRef.current?.scrollIntoView(scrollIntoViewOptions);
    }
  }, [targetParam, activeParam, scrollIntoViewOptions]);

  return (
    createElement(
      elementType || 'div',
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
