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
};

function ImageCard({
  url, alt, backgroundColorType, description, className,
}: Props) {
  return (
    <div className={clsx(styles.imageCardWrapper, className)}>
      <div className={clsx(styles[backgroundColorType], styles.imageWrapper)}>
        <Image
          src={url}
          alt={alt}
          width={0}
          height={0}
          sizes="100vw"
          className={clsx(styles.cardImage)}
        />
      </div>
      <div className={styles.description}>
        {description}
      </div>
    </div>
  );
}

export default ImageCard;
