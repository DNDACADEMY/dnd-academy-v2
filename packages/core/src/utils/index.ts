import qs from 'qs';

interface ListBlobResultBlob {
  url: string;
  downloadUrl: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

export const paramsSerializer = <T>(params: T): string => qs.stringify(params, {
  arrayFormat: 'comma',
  indices: false,
});

export const getLatestItemReduce = (
  items: ListBlobResultBlob[],
): ListBlobResultBlob => items
  .reduce((latest, current) => (current.uploadedAt > latest.uploadedAt ? current : latest));

export const serverErrorHandling = async <T>(apiCallback: () => Promise<T>) => {
  try {
    const response = await apiCallback();

    return response;
  } catch (error) {
    return null;
  }
};
