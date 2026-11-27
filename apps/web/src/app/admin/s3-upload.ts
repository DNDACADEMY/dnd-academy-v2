import { adminRequest } from './admin-request';

type Put = { method: 'put'; url: string; headers: Record<string, string> };
type Multipart = { method: 'multipart'; parts: { offset: number; bytes: number; url: string }[]; uploaded: number };
export type S3Ticket = { provider: 's3'; key: string } & (Put | { method: 'multipart' });

function send(
  url: string,
  body: Blob,
  headers: Record<string, string>,
  signal: AbortSignal,
  onProgress: (bytes: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    signal.addEventListener('abort', abort, { once: true });
    request.onloadend = () => signal.removeEventListener('abort', abort);
    request.upload.onprogress = (event) => onProgress(event.loaded);
    request.onerror = () => reject(new Error('파일 전송에 실패했습니다.'));
    request.onabort = () => reject(new Error('업로드를 일시 중지했습니다.'));
    request.onload = () => {
      if ((request.status >= 200 && request.status < 300) || (headers['If-None-Match'] && request.status === 412)) {
        resolve();
      } else {
        reject(new Error('파일 전송에 실패했습니다.'));
      }
    };
    request.open('PUT', url);
    for (const [name, value] of Object.entries(headers)) request.setRequestHeader(name, value);
    request.send(body);
  });
}

export async function uploadToS3(
  file: File,
  ticket: S3Ticket,
  retry: boolean,
  signal: AbortSignal,
  onProgress: (percent: number) => void,
  requestMedia: <T>(payload: unknown) => Promise<T> = (payload) => adminRequest('media', payload),
) {
  const request =
    ticket.method === 'put' && !retry
      ? ticket
      : await requestMedia<Put | Multipart>({ action: 'resume', key: ticket.key });
  const progress = (bytes: number) => onProgress(Math.round((100 * bytes) / file.size));

  if (request.method === 'put') {
    await send(request.url, file, request.headers, signal, progress);
  } else {
    let uploaded = request.uploaded;
    for (const part of request.parts) {
      const piece = file.slice(part.offset, part.offset + part.bytes);
      await send(part.url, piece, {}, signal, (sent) => progress(uploaded + sent));
      uploaded += part.bytes;
    }
  }
  progress(file.size);
}
