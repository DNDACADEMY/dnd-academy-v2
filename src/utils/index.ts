import dayjs from 'dayjs';
import qs from 'qs';

const CACHE_MINUTE = 5;

export const paramsSerializer = <T>(params: T): string => qs.stringify(params, {
  arrayFormat: 'comma',
  indices: false,
});

export const isSSR = typeof window === 'undefined';

export const getCacheDate = (cacheTime = CACHE_MINUTE) => {
  const date = dayjs().format('YYYY-MM-DD-HH');
  const currentMin = dayjs().get('minute');
  const modMin = dayjs().get('minute') % cacheTime;
  const minute = modMin === 0 ? currentMin : currentMin - modMin;

  return {
    date: `${date}-${minute}`,
  };
};
