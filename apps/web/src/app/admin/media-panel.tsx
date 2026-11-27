'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { mediaMax } from '@/lib/cms/content-contract';

import { adminRequest } from './admin-request';
import { type S3Ticket, uploadToS3 } from './s3-upload';

import styles from './styles.module.scss';

const mib = 1024 * 1024;
const size = (file: File) => `${(file.size / mib).toFixed(2)} MiB`;

function useLocalFile() {
  const [selected, setSelected] = useState<{ file: File; url: string }>();
  const url = selected?.url ?? '';
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return [
    selected?.file,
    (file?: File) => setSelected(file ? { file, url: URL.createObjectURL(file) } : undefined),
    url,
  ] as const;
}

async function toWebp(file: File, quality: number) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('PNG·JPEG·WebP 이미지를 선택해 주세요.');
  if (file.type === 'image/png') {
    const bytes = new DataView(await file.arrayBuffer());
    for (let offset = 8; offset + 12 <= bytes.byteLength; offset += bytes.getUint32(offset) + 12) {
      const chunk = bytes.getUint32(offset + 4);
      if (chunk === 0x6163544c) throw new Error('애니메이션은 프레임이 보존된 WebP로 선택해 주세요.');
      if (chunk === 0x49444154) break;
    }
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    if (file.type === 'image/webp') return file;
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('이미지를 변환할 수 없습니다.');
    context.drawImage(bitmap, 0, 0);
    let output = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (output?.type !== 'image/webp') {
      const { default: encode } = await import('@jsquash/webp/encode');
      output = new Blob(
        [await encode(context.getImageData(0, 0, bitmap.width, bitmap.height), { quality: quality * 100 })],
        { type: 'image/webp' },
      );
    }
    return new File([output], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
  } finally {
    bitmap.close();
  }
}

async function pdfFingerprint(file: File, signal: AbortSignal) {
  const { pdfjs } = await import('react-pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const data = new Uint8Array(await file.arrayBuffer());
  signal.throwIfAborted();
  const worker = pdfjs.getDocument({ data, isEvalSupported: false });
  let destruction: Promise<void> | undefined;
  const destroy = () => (destruction ??= worker.destroy());
  const stop = () => {
    void destroy().catch(() => undefined);
  };
  signal.addEventListener('abort', stop, { once: true });
  try {
    const document = await worker.promise;
    const pages = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const text = await page.getTextContent();
      const annotations = await page.getAnnotations();
      pages.push({
        text: text.items
          .flatMap((item) => ('str' in item ? [item.str] : []))
          .join('')
          .normalize('NFC')
          .replace(/\s+/g, ''),
        links: (
          await Promise.all(
            annotations
              .filter((annotation) => annotation.subtype === 'Link')
              .map(async ({ unsafeUrl, url, dest }) => {
                const destination = typeof dest === 'string' ? await document.getDestination(dest) : dest;
                const [target, ...position] = Array.isArray(destination) ? destination : [];
                const pageIndex = target && typeof target === 'object' ? await document.getPageIndex(target) : target;
                return JSON.stringify([unsafeUrl ?? url ?? null, pageIndex ?? null, position]);
              }),
          )
        ).sort(),
      });
      page.cleanup();
    }
    return JSON.stringify(pages);
  } finally {
    signal.removeEventListener('abort', stop);
    await destroy();
  }
}

export default function MediaPanel({
  mime,
  onAttach,
  onBusy,
  requestMedia = (payload) => adminRequest('media', payload),
  onLocalPreview,
}: {
  mime: 'image/webp' | 'application/pdf';
  onAttach: (id: string) => void;
  onBusy: (busy: boolean) => void;
  requestMedia?: <T>(payload: unknown) => Promise<T>;
  onLocalPreview?: (url: string | undefined) => void;
}) {
  const [source, setSource, sourceUrl] = useLocalFile();
  const [candidate, setCandidate, candidateUrl] = useLocalFile();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quality, setQuality] = useState(0.83);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [pending, setPending] = useState<{ file: File; ticket: UploadTicket }>();
  const [cancel, setCancel] = useState<{ label: string; action: () => void }>();
  const isPdf = source?.type === 'application/pdf' && mime === 'application/pdf';
  const rightType = mime === 'application/pdf' ? isPdf : !!candidate;

  useEffect(() => {
    onBusy(busy);
  }, [busy, onBusy]);

  useEffect(() => {
    onLocalPreview?.(candidateUrl ?? sourceUrl);
    return () => onLocalPreview?.(undefined);
  }, [candidateUrl, sourceUrl, onLocalPreview]);

  async function prepare(file: File, level = quality) {
    setSource(file);
    setCandidate(undefined);
    setPending(undefined);
    setAccepted(false);
    setMessage('');
    setBusy(true);
    try {
      if (file.size > mediaMax) throw new Error('200 MiB 이하 파일을 선택해 주세요.');
      if (mime === 'application/pdf') {
        if (file.type !== mime) throw new Error('PDF 파일을 선택해 주세요.');
        if (file.size > 20 * mib) setMessage('로컬에서 PDF를 최적화한 뒤 압축 후보를 추가할 수 있습니다.');
      } else {
        setCandidate(await toWebp(file, level));
      }
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function comparePdf(file: File) {
    if (!source) return;
    setCandidate(undefined);
    setAccepted(false);
    setPending(undefined);
    setBusy(true);
    const controller = new AbortController();
    setCancel({ label: 'PDF 비교 취소', action: () => controller.abort() });
    try {
      if (file.type !== 'application/pdf' || file.size >= source.size)
        throw new Error('원본보다 작은 PDF를 선택해 주세요.');
      const original = await pdfFingerprint(source, controller.signal);
      const compressed = await pdfFingerprint(file, controller.signal);
      if (original !== compressed) throw new Error('페이지 수·검색 텍스트·링크가 원본과 다릅니다.');
      setCandidate(file);
      setMessage('페이지 수·텍스트·링크가 일치합니다. 한글 검색과 확대 화질을 직접 확인해 주세요.');
    } catch {
      setMessage(
        controller.signal.aborted
          ? 'PDF 비교를 취소했습니다.'
          : '압축본의 페이지·텍스트·링크를 확인하지 못했습니다. 원본으로 다시 선택할 수 있습니다.',
      );
    } finally {
      setCancel(undefined);
      setBusy(false);
    }
  }

  async function upload(useOriginal = false) {
    const file = useOriginal && isPdf ? source : (candidate ?? (isPdf ? source : undefined));
    if (!file || !accepted || file.size > mediaMax) return;
    setProgress(0);
    setBusy(true);
    setMessage('');
    try {
      const ticket =
        pending?.file === file
          ? pending.ticket
          : await requestMedia<UploadTicket>({ action: 'upload', mime: file.type, bytes: file.size });
      setPending({ file, ticket });
      if (ticket.provider === 's3') {
        const controller = new AbortController();
        setCancel({
          label: ticket.method === 'multipart' ? '전송 일시 중지' : '전송 취소',
          action: () => controller.abort(),
        });
        try {
          await uploadToS3(file, ticket, pending?.file === file, controller.signal, setProgress, requestMedia);
        } finally {
          setCancel(undefined);
        }
      } else if (file.size > 6 * 1024 * 1024) {
        const { Upload } = await import('tus-js-client');
        await new Promise<void>((resolve, reject) => {
          const upload = new Upload(file, {
            endpoint: ticket.endpoint,
            chunkSize: 6 * 1024 * 1024,
            retryDelays: [0, 1000, 3000, 5000],
            headers: { 'x-signature': ticket.token },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            fingerprint: async () => `dnd-cms:${ticket.key}`,
            metadata: {
              bucketName: ticket.bucket,
              objectName: ticket.key,
              contentType: file.type,
              cacheControl: '3600',
            },
            onProgress: (done, total) => setProgress(Math.round((100 * done) / total)),
            onError: reject,
            onSuccess: () => resolve(),
          });
          setCancel({
            label: '전송 일시 중지',
            action: () => {
              void upload
                .abort()
                .finally(() => reject(new Error('전송을 일시 중지했습니다. 업로드 버튼으로 재개할 수 있습니다.')));
            },
          });
          void upload
            .findPreviousUploads()
            .then((previous) => {
              if (previous[0]) upload.resumeFromPreviousUpload(previous[0]);
              upload.start();
            })
            .catch(reject);
        });
      } else {
        const response = await fetch(ticket.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        if (!response.ok && response.status !== 409) throw new Error('파일 전송에 실패했습니다.');
      }
      const asset = await requestMedia<{ id: string }>({
        action: 'verify',
        key: ticket.key,
        name: (file.name.trim() || '첨부 파일').slice(0, 255),
      });
      onBusy(false);
      onAttach(asset.id);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setCancel(undefined);
      setBusy(false);
    }
  }

  return (
    <section className={styles.uploadPanel}>
      <div className={styles.cardHeading}>
        <p>
          {mime === 'application/pdf'
            ? 'PDF 페이지와 화질을 확인한 뒤 연결하세요.'
            : '이미지는 WebP로 변환됩니다. 원본과 변환본을 비교한 뒤 연결하세요.'}
        </p>
      </div>
      <div className={styles.form}>
        <label className={styles.filePicker}>
          로컬 파일{' '}
          <input
            type="file"
            disabled={busy}
            accept={mime === 'application/pdf' ? mime : 'image/png,image/jpeg,image/webp'}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void prepare(file);
            }}
          />
        </label>
        {source && mime === 'image/webp' && (
          <label>
            WebP 품질{' '}
            <select
              value={quality}
              disabled={busy}
              onChange={(event) => {
                const level = Number(event.target.value);
                setQuality(level);
                void prepare(source, level);
              }}
            >
              <option value={0.83}>사진 · 표준</option>
              <option value={0.99}>UI 캡처 · 고화질</option>
            </select>
          </label>
        )}
        {isPdf && source.size > 20 * mib && (
          <label>
            로컬에서 압축한 PDF (선택){' '}
            <input
              type="file"
              accept="application/pdf"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void comparePdf(file);
              }}
            />
          </label>
        )}
        {source && (
          <div className={styles.grid}>
            <LocalPreview label="원본" file={source} url={sourceUrl} />
            {candidate && <LocalPreview label="전송 후보" file={candidate} url={candidateUrl} />}
          </div>
        )}
        {rightType && source && source.size <= mediaMax && (
          <>
            <label>
              <input
                type="checkbox"
                checked={accepted}
                disabled={busy}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              {isPdf
                ? '페이지·한글 검색·링크·확대 화질을 확인했습니다.'
                : '전송 후보의 방향·투명도·이미지 품질을 확인했습니다.'}
            </label>
            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.primary}
                disabled={busy || !accepted}
                onClick={() => void upload()}
              >
                {pending ? '업로드 재개' : '업로드하고 연결'}
              </button>
              {isPdf && candidate && (
                <button type="button" disabled={busy || !accepted} onClick={() => void upload(true)}>
                  원본 PDF로 연결
                </button>
              )}
              {cancel && (
                <button type="button" onClick={cancel.action}>
                  {cancel.label}
                </button>
              )}
            </div>
          </>
        )}
        {progress > 0 && <progress value={progress} max={100} aria-label="파일 전송 진행률" />}
        {message && <p role="status">{message}</p>}
      </div>
    </section>
  );
}

type UploadTicket =
  | S3Ticket
  | { provider: 'supabase'; key: string; url: string; token: string; endpoint: string; bucket: string };

function LocalPreview({ file, url, label }: { file: File; url: string; label: string }) {
  return (
    <div className={styles.mediaPreview}>
      <strong>
        {label} · {size(file)}
      </strong>
      {url &&
        (file.type === 'application/pdf' ? (
          <iframe src={url} title={`${label} PDF`} />
        ) : (
          <Image unoptimized src={url} width={960} height={540} alt={`${label} 이미지`} />
        ))}
    </div>
  );
}
