import qs from 'qs';

export const paramsSerializer = <T>(params: T): string => qs.stringify(params, {
  arrayFormat: 'comma',
  indices: false,
});