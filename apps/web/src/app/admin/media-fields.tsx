'use client';

import Image from 'next/image';
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import type { ContentInput, MediaItem, MediaLibrary } from '@/lib/cms/content-contract';

import { adminRequest } from './admin-request';
import MediaPanel from './media-panel';

import styles from './styles.module.scss';

type Attachment = NonNullable<ContentInput['images']>[number];
type Target = 'thumbnail' | 'pdf' | 'gallery';

export type MediaSelection = {
  thumbnail: Attachment | null;
  pdf: Attachment | null;
  gallery: Attachment[];
};

const imageMime = 'image/webp';
const pdfMime = 'application/pdf';

function filename(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');
  } catch {
    return '';
  }
}

function MediaFile({ name, mime, url, bytes }: Omit<MediaItem, 'id'>) {
  return (
    <div className={styles.mediaFile}>
      {mime === imageMime ? (
        <Image unoptimized src={url} width={72} height={56} alt="" />
      ) : (
        <span className={styles.pdfIcon} aria-hidden="true">
          PDF
        </span>
      )}
      <div>
        <a href={url} target="_blank" rel="noreferrer">
          {name || (mime === pdfMime ? 'PDF 문서' : '이미지 파일')}
        </a>
        {bytes > 0 && <small>{(bytes / 1024 / 1024).toFixed(2)} MiB</small>}
      </div>
    </div>
  );
}

export default function MediaFields({
  kind,
  selection,
  onChange,
  disabled,
}: {
  kind: 'project' | 'organizer';
  selection: MediaSelection;
  onChange: (selection: MediaSelection) => void;
  disabled: boolean;
}) {
  const [picker, setPicker] = useState<Target>();
  const [mode, setMode] = useState<'upload' | 'library'>('upload');
  const [uploadsBusy, setUploadsBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openDialog = useCallback((dialog: HTMLDialogElement | null) => {
    dialogRef.current = dialog;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  const [result, setResult] = useState<{ ids: string; items: MediaItem[] }>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const ids = [
    ...new Set(
      [selection.thumbnail, selection.pdf, ...selection.gallery].flatMap((entry) =>
        entry?.mediaId ? [entry.mediaId] : [],
      ),
    ),
  ].join(',');
  const labels = {
    thumbnail: kind === 'project' ? '대표 이미지' : '프로필 이미지',
    pdf: '발표 PDF',
    gallery: '갤러리 이미지',
  };

  useEffect(() => {
    if (!ids) return;
    let active = true;
    void adminRequest<{ media: MediaItem[] }>('content/preview', { mediaIds: ids.split(','), projectId: null })
      .then(({ media }) => {
        if (active) {
          setResult({ ids, items: media });
          setError('');
        }
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [ids]);

  function show(target: Target) {
    setMode('upload');
    setPicker(target);
    setNotice('');
  }

  function attach(id: string) {
    if (!picker) return;
    const entry = { mediaId: id };
    if (picker === 'gallery') {
      if (selection.gallery.length >= 50 || selection.gallery.some(({ mediaId }) => mediaId === id)) return;
      onChange({ ...selection, gallery: [...selection.gallery, entry] });
    } else {
      onChange({ ...selection, [picker]: entry });
    }
    setNotice(`${labels[picker]}에 연결했습니다. 초안을 저장하면 연결이 유지됩니다.`);
    dialogRef.current?.close();
  }

  function file(entry: Attachment, mime: MediaItem['mime']) {
    const item = result?.items.find(({ id }) => id === entry.mediaId);
    if (item) return <MediaFile {...item} />;
    if (entry.legacyUrl)
      return <MediaFile mime={mime} url={entry.legacyUrl} name={filename(entry.legacyUrl)} bytes={0} />;
    return (
      <p className={styles.muted}>
        {error || result?.ids === ids ? '첨부 정보를 확인할 수 없습니다.' : '연결된 파일 정보를 불러오는 중…'}
      </p>
    );
  }

  return (
    <div className={styles.mediaArea}>
      <div className={styles.cardHeading}>
        <h3>연결된 파일</h3>
        <p>연결을 바꾼 뒤 초안을 저장하세요.</p>
      </div>
      {notice && (
        <p role="status" className={styles.status}>
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {(['thumbnail', 'pdf'] as const)
        .filter((target) => kind === 'project' || target === 'thumbnail')
        .map((target) => (
          <section key={target} className={styles.mediaSlot} aria-label={labels[target]}>
            <div className={styles.mediaSlotHeading}>
              <h4>{labels[target]}</h4>
              <button type="button" disabled={disabled} onClick={() => show(target)}>
                {selection[target] ? `${labels[target]} 변경` : `${labels[target]} 추가`}
              </button>
            </div>
            {selection[target] ? (
              <div className={styles.mediaRow}>
                {file(selection[target], target === 'pdf' ? pdfMime : imageMime)}
                <button
                  type="button"
                  className={styles.quiet}
                  disabled={disabled}
                  aria-label={`${labels[target]} 연결 해제`}
                  onClick={() => onChange({ ...selection, [target]: null })}
                >
                  연결 해제
                </button>
              </div>
            ) : (
              <p className={styles.muted}>연결된 파일이 없습니다.</p>
            )}
          </section>
        ))}
      {kind === 'project' && (
        <section className={styles.mediaSlot} aria-label="갤러리 이미지">
          <div className={styles.mediaSlotHeading}>
            <h4>
              갤러리 이미지 <small>{selection.gallery.length} / 50</small>
            </h4>
            <button type="button" disabled={disabled || selection.gallery.length >= 50} onClick={() => show('gallery')}>
              갤러리 이미지 추가
            </button>
          </div>
          {selection.gallery.length ? (
            <ol className={styles.mediaRows}>
              {selection.gallery.map((entry, index) => (
                <li key={`${entry.mediaId ?? entry.legacyUrl}:${index}`} className={styles.mediaRow}>
                  {file(entry, imageMime)}
                  <button
                    type="button"
                    className={styles.quiet}
                    disabled={disabled}
                    aria-label={`갤러리 이미지 ${index + 1} 연결 해제`}
                    onClick={() =>
                      onChange({ ...selection, gallery: selection.gallery.filter((_, position) => position !== index) })
                    }
                  >
                    연결 해제
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.muted}>연결된 이미지가 없습니다.</p>
          )}
        </section>
      )}
      {picker && (
        <dialog
          ref={openDialog}
          className={styles.mediaDialog}
          aria-labelledby="media-dialog-title"
          onCancel={(event) => {
            if (uploadsBusy) event.preventDefault();
          }}
          onClose={() => setPicker(undefined)}
        >
          <header className={styles.mediaDialogHeading}>
            <h3 id="media-dialog-title">{labels[picker]} 연결</h3>
            <button type="button" disabled={uploadsBusy} onClick={() => dialogRef.current?.close()}>
              닫기
            </button>
          </header>
          <div className={styles.tabs} aria-label="파일 가져오기">
            <button type="button" aria-pressed={mode === 'upload'} onClick={() => setMode('upload')}>
              새 파일 업로드
            </button>
            <button
              type="button"
              disabled={uploadsBusy}
              aria-pressed={mode === 'library'}
              onClick={() => setMode('library')}
            >
              기존 파일 선택
            </button>
          </div>
          {mode === 'upload' ? (
            <MediaPanel mime={picker === 'pdf' ? pdfMime : imageMime} onAttach={attach} onBusy={setUploadsBusy} />
          ) : (
            <ExistingFiles
              mime={picker === 'pdf' ? pdfMime : imageMime}
              selected={(picker === 'gallery' ? selection.gallery : [selection[picker]]).flatMap((entry) =>
                entry?.mediaId ? [entry.mediaId] : [],
              )}
              onChoose={attach}
            />
          )}
        </dialog>
      )}
    </div>
  );
}

function ExistingFiles({
  mime,
  selected,
  onChoose,
}: {
  mime: MediaItem['mime'];
  selected: string[];
  onChoose: (id: string) => void;
}) {
  const [filter, setFilter] = useState({ query: '', page: 0 });
  const [result, setResult] = useState<MediaLibrary>();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void adminRequest<MediaLibrary>('media', { action: 'library', mime, ...filter })
      .then((result) => {
        if (active) setResult(result);
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [filter, mime]);

  function load(query: string, page: number) {
    setResult(undefined);
    setError('');
    setFilter({ query, page });
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get('query') ?? '').trim();
    load(query, 0);
  }

  return (
    <div className={styles.existingMedia}>
      <form onSubmit={search} role="search" aria-label="기존 파일 검색">
        <input name="query" type="search" aria-label="파일 이름" placeholder="파일 이름으로 검색" maxLength={160} />
        <button type="submit">검색</button>
      </form>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!result && !error && <p role="status">파일을 불러오는 중입니다.</p>}
      {result &&
        (result.items.length ? (
          <ul className={styles.mediaRows}>
            {result.items.map((item) => (
              <li key={item.id} className={styles.mediaRow}>
                <MediaFile {...item} />
                <button type="button" disabled={selected.includes(item.id)} onClick={() => onChoose(item.id)}>
                  {selected.includes(item.id) ? '연결됨' : '선택'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>조건에 맞는 파일이 없습니다.</p>
        ))}
      {(filter.page > 0 || result?.hasMore) && (
        <nav className={styles.buttons} aria-label="파일 목록 페이지">
          <button type="button" disabled={filter.page === 0} onClick={() => load(filter.query, filter.page - 1)}>
            이전
          </button>
          <span>{filter.page + 1} 페이지</span>
          <button type="button" disabled={!result?.hasMore} onClick={() => load(filter.query, filter.page + 1)}>
            다음
          </button>
        </nav>
      )}
    </div>
  );
}
