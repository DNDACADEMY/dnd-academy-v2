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
