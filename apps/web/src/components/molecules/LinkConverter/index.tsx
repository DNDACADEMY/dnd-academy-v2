import {
  ComponentProps, createElement, ElementType, Fragment,
} from 'react';

import ExternalLink from '@/components/atoms/ExternalLink';

import styles from './index.module.scss';

type LinkConverterProps<E extends ElementType> = {
  elementType?: E;
  className?: string;
  text: string;
};

type Props<E extends ElementType> =
  LinkConverterProps<E> & Omit<ComponentProps<E>, keyof LinkConverterProps<E>>;

function LinkConverter<E extends ElementType>({
  className, text, elementType, ...props
}: Props<E>) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = text.split(urlRegex).reduce((acc, part, index) => [
    ...acc,
    {
      contents: part,
      isUrl: urlRegex.test(part),
      key: urlRegex.test(part) ? `link-${index}` : `text-${index}`,
    },
  ], [] as { contents: string; isUrl: boolean; key: string }[]);

  return (
    createElement(
      elementType || 'div',
      {
        ...props,
        className,
      },
      parts.map(({ contents, isUrl, key }) => {
        if (isUrl) {
          return (
            <ExternalLink
              key={key}
              href={contents}
              className={styles.link}
            >
              {contents}
            </ExternalLink>
          );
        }

        return (
          <Fragment key={key}>
            {contents}
          </Fragment>
        );
      }),
    )
  );
}

export default LinkConverter;
