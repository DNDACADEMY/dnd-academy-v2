import qs from 'qs';

// eslint-disable-next-line import/prefer-default-export
export const paramsSerializer = <T>(params: T): string => qs.stringify(params, {
  arrayFormat: 'comma',
  indices: false,
});
