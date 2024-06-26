'use client';

import { useCallback, useMemo } from 'react';

import { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';

import clsx from 'clsx';

import Tag from '@/components/atoms/Tag';
import { paramsSerializer, sortFlagsDescending } from '@/utils';

import styles from './index.module.scss';

type Props<T extends string> = {
  paramKey: string;
  size?: 'small' | 'medium';
  tagCount: Record<T, number>;
  route: Route;
};

function Tags<T extends string>({
  paramKey, tagCount, route, size = 'small',
}: Props<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramValue = searchParams.get(paramKey);

  const totalCount = Object.values<number>(tagCount).reduce((acc, value) => acc + value, 0);

  const handleClick = useCallback((id?: number | string) => () => router.push(`${route}?${paramsSerializer({ [paramKey]: id })}`), [route, paramKey]);

  const sortedTagCount = useMemo(
    () => [...Object.entries<number>(tagCount)]
      .sort((a, b) => sortFlagsDescending(a[0], b[0]))
      .map(([key, count]) => (
        <Tag
          key={key}
          title={key}
          count={count}
          size={size}
          isActive={paramValue === key}
          onClick={handleClick(key)}
        />
      )),
    [paramValue, tagCount, size],
  );

  return (
    <div className={clsx(styles.tagWrapper, styles[size])}>
      <Tag
        title="전체"
        count={totalCount}
        isActive={!paramValue || paramValue === 'all'}
        onClick={handleClick('all')}
        size={size}
      />
      {sortedTagCount}
    </div>
  );
}

export default Tags;
