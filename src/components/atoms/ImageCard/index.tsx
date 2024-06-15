import { ReactNode } from 'react';

import Image from 'next/image';

import clsx from 'clsx';

import styles from './index.module.scss';

type Props = {
  url: string;
  alt: string;
  backgroundColorType: 'primary' | 'secondary' | 'tertiary';
  description: ReactNode;
  className?: string;
  fullWidth?: boolean;
  isReversed?: boolean;
};

function ImageCard({
  url, alt, backgroundColorType, description, className, fullWidth, isReversed,
}: Props) {
  const fullWidthClassName = fullWidth && styles.fullWidth;

  return (
    <div className={
      clsx(
        styles.imageCardWrapper,
        fullWidthClassName,
        isReversed && styles.isReversed,
        className,
      )
    }
    >
      <div className={clsx(
        styles[backgroundColorType],
        styles.imageWrapper,
        fullWidthClassName,
      )}
      >
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(max-width: 1204px) 50vw, 33vw"
          className={clsx(styles.cardImage, fullWidthClassName)}
        />
      </div>
      <div className={clsx(styles.description, fullWidthClassName)}>
        {description}
      </div>
    </div>
  );
}

export default ImageCard;
