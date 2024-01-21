import dayjs from 'dayjs';

import { paramsSerializer } from '@/utils';

import { FetchRequest } from './model';

const CACHE_MINUTE = 5;

// TODO - fetch error 수정 필요
export class FetchError extends Error {
  constructor(
    response: Response,
  ) {
    super();
    this.response = response;
  }

  response?: Response;
}

export const getCacheDate = (cacheTime = CACHE_MINUTE) => {
  const date = dayjs().format('YYYY-MM-DD-HH');
  const currentMin = dayjs().get('minute');
  const modMin = dayjs().get('minute') % cacheTime;
  const minute = modMin === 0 ? currentMin : currentMin - modMin;

  return `?date=${date}-${minute}`;
};

const getUrl = (url: string, isBFF = false) => {
  if (isBFF) {
    return `${process.env.NEXT_PUBLIC_ORIGIN}/api${url}`;
  }

  return `${process.env.NEXT_PUBLIC_API_HOST}${url}`;
};

async function api<T, K>({
  url, params, config = {}, isBFF, method = 'GET',
}: FetchRequest<K>): Promise<T> {
  const response = await fetch(`${getUrl(url, isBFF)}?${paramsSerializer({
    ...params,
  })}`, {
    ...config,
    method,
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new FetchError(response);
  }

  const data = await response.json() as Promise<T>;

  return data;
}

export default api;
