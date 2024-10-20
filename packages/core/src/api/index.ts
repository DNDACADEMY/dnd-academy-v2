import { paramsSerializer } from '../utils';

type Method =
    | 'get' | 'GET'
    | 'delete' | 'DELETE'
    | 'post' | 'POST'
    | 'put' | 'PUT'
    | 'patch' | 'PATCH';

export type UrlPrefixType = 'public' | 'bff' | 'blob';

export interface ApiRequest<T = unknown> {
  url: string;
  params?: T;
  method?: Method;
  body?: BodyInit | null;
  type?: UrlPrefixType;
  config?: Omit<RequestInit, 'method' | 'body'>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const getUrl = (url: string, type: UrlPrefixType) => {
  if (type === 'bff') {
    return `${process.env.NEXT_PUBLIC_ORIGIN}/api${url}`;
  }

  if (type === 'blob') {
    return `${process.env.NEXT_PUBLIC_VERCEL_BLOB_HOST}${url}`;
  }

  return url;
};

export async function api<T, K = unknown>({
  url, params, config = {}, body, type = 'public', method = 'GET',
}: ApiRequest<K>): Promise<T> {
  const headers = new Headers(config.headers);

  try {
    const response = await fetch(`${getUrl(url, type)}${params ? `?${paramsSerializer(params)}` : ''}`, {
      ...config,
      headers,
      method,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));

      throw new ApiError(response.status, errorBody?.message || response.statusText);
    }

    const data = await response.json() as T;

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, 'An unexpected error occurred');
  }
}
