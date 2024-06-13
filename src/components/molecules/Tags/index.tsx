'use client';

import { useCallback, useMemo } from 'react';

import { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';

import Tag from '@/components/atoms/Tag';
import { paramsSerializer, sortFlagsDescending } from '@/utils';

import styles from './index.module.scss';

type Props<T extends string> = {
  paramKey: string;
  tagCount: Record<T, number>;
  route: Route;
};

function Tags<T extends string>({ paramKey, tagCount, route }: Props<T>) {
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
          isActive={paramValue === key}
          onClick={handleClick(key)}
        />
      )),
    [paramValue],
  );

  return (
    <div className={styles.tagWrapper}>
      <Tag title="전체" count={totalCount} isActive={!paramValue} onClick={handleClick()} />
      {sortedTagCount}
    </div>
  );
}

export default Tags;
