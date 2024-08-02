import { paramsSerializer } from '../utils';

type Method =
    | 'get' | 'GET'
    | 'delete' | 'DELETE'
    | 'head' | 'HEAD'
    | 'options' | 'OPTIONS'
    | 'post' | 'POST'
    | 'put' | 'PUT'
    | 'patch' | 'PATCH'
    | 'purge' | 'PURGE'
    | 'link' | 'LINK'
    | 'unlink' | 'UNLINK';

export type UrlPrefixType = 'public' | 'bff';

export interface FetchRequest<T = any> {
  url: string;
  params?: T;
  method?: Method;
  type?: UrlPrefixType;
  config?: Omit<RequestInit, 'method'>;
}

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

  return `${process.env.NEXT_PUBLIC_VERCEL_BLOB_HOST}${url}`;
};

export async function api<T, K = undefined>({
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
