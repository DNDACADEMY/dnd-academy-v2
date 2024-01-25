import dayjs from 'dayjs';

import { paramsSerializer } from '@/utils';

import { FetchRequest, UrlPrefixType } from './model';

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

  return {
    date: `${date}-${minute}`,
  };
};

const getUrl = (url: string, type: UrlPrefixType) => {
  if (type === 'bff') {
    return `${process.env.NEXT_PUBLIC_ORIGIN}/api${url}`;
  }

  if (type === 'blog') {
    return `${process.env.NEXT_PUBLIC_BLOG_HOST}${url}`;
  }

  return `${process.env.NEXT_PUBLIC_API_HOST}${url}`;
};

async function api<T, K = undefined>({
  url, params, config = {}, type = 'public', method = 'GET',
}: FetchRequest<K>): Promise<T> {
  const response = await fetch(`${getUrl(url, type)}?${paramsSerializer({
    ...params,
  })}`, {
    ...config,
    method,
  });

  if (!response.ok) {
    throw new FetchError(response);
  }

  const data = await response.json() as Promise<T>;

  return data;
}

export default api;
