import { createElement, Fragment, JSX } from 'react';

import ExternalLink from '@/components/atoms/ExternalLink';

import styles from './index.module.scss';

type Props<ElementType extends keyof JSX.IntrinsicElements> =
JSX.IntrinsicElements[ElementType] & {
  elementType?: keyof JSX.IntrinsicElements;
  className?: string;
  text: string;
};

function LinkConverter<E extends keyof JSX.IntrinsicElements>({
  className, text, elementType = 'div', ...props
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
      elementType,
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
