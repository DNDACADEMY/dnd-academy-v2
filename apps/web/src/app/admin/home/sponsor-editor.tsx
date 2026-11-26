import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import type { MediaItem } from '@/lib/cms/content-contract';
import type { HomeInput } from '@/lib/cms/home-contract';

import { adminRequest } from '../admin-request';
import { HomeRow, RowActions, replaceRow } from './editor-row';

import styles from '../styles.module.scss';

const MediaPanel = dynamic(() => import('../media-panel'), { ssr: false });

export function SponsorEditor({
  sponsors,
  sponsorInfo,
  onChange,
}: Pick<HomeInput, 'sponsors' | 'sponsorInfo'> & {
  onChange: (update: Pick<HomeInput, 'sponsors'> | Pick<HomeInput, 'sponsorInfo'>) => void;
}) {
  const [logoRow, setLogoRow] = useState<number>();
  const [uploading, setUploading] = useState(false);
  const [logos, setLogos] = useState<Record<string, string>>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = [...new Set(sponsors.flatMap(({ mediaId }) => (mediaId ? [mediaId] : [])))].join(',');

  useEffect(() => {
    if (logoRow !== undefined) dialog.current?.showModal();
  }, [logoRow]);

  useEffect(() => {
    if (!ids) return;
    let active = true;
    const assetIds = ids.split(',');
    const batches = Array.from({ length: Math.ceil(assetIds.length / 52) }, (_, index) =>
      assetIds.slice(index * 52, (index + 1) * 52),
    );
    void Promise.all(
      batches.map((mediaIds) => adminRequest<{ media: MediaItem[] }>('content/preview', { mediaIds, projectId: null })),
    )
      .then((groups) => {
        if (active) setLogos(Object.fromEntries(groups.flatMap(({ media }) => media.map(({ id, url }) => [id, url]))));
      })
      .catch(() => {
        if (active) setLogos({});
      });
    return () => {
      active = false;
    };
  }, [ids]);

  return (
    <div className={styles.homeFields}>
      <label>
        후원 안내{' '}
        <textarea
          maxLength={2000}
          value={sponsorInfo.description}
          onChange={(event) => onChange({ sponsorInfo: { ...sponsorInfo, description: event.target.value } })}
        />
      </label>
      <label>
        후원 문의 링크{' '}
        <input
          type="url"
          value={sponsorInfo.contactUrl ?? ''}
          onChange={(event) => onChange({ sponsorInfo: { ...sponsorInfo, contactUrl: event.target.value || null } })}
        />
      </label>
      <div className={styles.mediaSlotHeading}>
        <h3>후원사 {sponsors.length}개</h3>
        <button
          type="button"
          disabled={sponsors.length === 100}
          onClick={() =>
            onChange({ sponsors: [...sponsors, { name: '', logoPath: null, mediaId: null, url: null, visible: true }] })
          }
        >
          후원사 추가
        </button>
      </div>
      {sponsors.map((row, index) => {
        const update = (value: Partial<typeof row>) =>
          onChange({ sponsors: replaceRow(sponsors, index, { ...row, ...value }) });
        const logo = row.logoPath ?? (row.mediaId ? logos[row.mediaId] : null);
        return (
          <HomeRow
            key={index}
            label={row.name || '새 후원사'}
            actions={<RowActions rows={sponsors} index={index} onChange={(sponsors) => onChange({ sponsors })} />}
          >
            <div className={styles.grid}>
              <label>
                후원사 이름{' '}
                <input value={row.name} maxLength={160} onChange={(event) => update({ name: event.target.value })} />
              </label>
              <label>
                후원사 링크{' '}
                <input
                  type="url"
                  value={row.url ?? ''}
                  onChange={(event) => update({ url: event.target.value || null })}
                />
              </label>
            </div>
            <div className={styles.buttons}>
              {logo && (
                <Image
                  src={logo}
                  alt={`${row.name} 로고`}
                  unoptimized
                  width={100}
                  height={40}
                  className={styles.homeLogo}
                />
              )}
              <button type="button" onClick={() => setLogoRow(index)}>
                {row.logoPath || row.mediaId ? '로고 변경' : '로고 올리기'}
              </button>
            </div>
            <label>
              <input
                type="checkbox"
                checked={row.visible}
                onChange={(event) => update({ visible: event.target.checked })}
              />
              홈에 공개
            </label>
          </HomeRow>
        );
      })}
      {logoRow !== undefined && (
        <dialog
          ref={dialog}
          className={styles.mediaDialog}
          aria-labelledby="home-logo-title"
          onCancel={(event) => {
            if (uploading) event.preventDefault();
          }}
          onClose={() => setLogoRow(undefined)}
        >
          <header className={styles.mediaDialogHeading}>
            <h3 id="home-logo-title">후원사 로고 업로드</h3>
            <button type="button" disabled={uploading} onClick={() => dialog.current?.close()}>
              닫기
            </button>
          </header>
          <MediaPanel
            mime="image/webp"
            onBusy={setUploading}
            onAttach={(mediaId) => {
              onChange({ sponsors: replaceRow(sponsors, logoRow, { ...sponsors[logoRow], mediaId, logoPath: null }) });
              dialog.current?.close();
            }}
          />
        </dialog>
      )}
    </div>
  );
}
