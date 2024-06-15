import { paramsSerializer } from '@/utils';

import { FetchRequest, UrlPrefixType } from './model';

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

const getUrl = (url: string, type: UrlPrefixType) => {
  if (type === 'bff') {
    return `${process.env.NEXT_PUBLIC_ORIGIN}/api${url}`;
  }

  return `${process.env.NEXT_PUBLIC_S3_HOST}${url}`;
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
