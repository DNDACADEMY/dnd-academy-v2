'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { type ContentInput, type ContentKind, linkKinds } from '@/lib/cms/content-contract';

import styles from './styles.module.scss';

type Link = ContentInput['links'][number];

export const linkLabels: Record<Link['kind'], string> = {
  github: 'GitHub',
  googlePlayStore: 'Google Play',
  youtube: 'YouTube',
  link: '웹사이트',
  figma: 'Figma',
  appStore: 'App Store',
  behance: 'Behance',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  email: '이메일',
  velog: 'Velog',
  tistory: '티스토리',
  medium: 'Medium',
  instagram: 'Instagram',
  naverBlog: '네이버 블로그',
  brunch: '브런치',
};

export default function LinkFields({
  kind,
  initial,
  onEdit,
}: {
  kind: ContentKind;
  initial: Link[];
  onEdit: () => void;
}) {
  const [rows, setRows] = useState(() => initial.map((link, id) => ({ ...link, id })));
  const nextId = useRef(initial.length);
  const focusId = useRef<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const allowedKinds = linkKinds.filter((link) => kind !== 'review' || link !== 'email');

  useEffect(() => {
    if (focusId.current === null) return;
    const input = container.current?.querySelector<HTMLInputElement>(`[data-link-id="${focusId.current}"]`);
    (input ?? addButton.current)?.focus();
    focusId.current = null;
  }, [rows.length]);

  function addLink() {
    const id = nextId.current++;
    focusId.current = id;
    setRows((current) => [...current, { id, kind: 'link', url: '' }]);
    onEdit();
  }

  function removeLink(index: number) {
    focusId.current = rows[index + 1]?.id ?? rows[index - 1]?.id ?? -1;
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    onEdit();
  }

  return (
    <div ref={container} className={styles.linkFields}>
      <div className={styles.linkFieldsHeader}>
        <h3>외부 링크</h3>
        <button type="button" ref={addButton} onClick={addLink} disabled={rows.length >= 50}>
          ＋ 링크 추가
        </button>
      </div>
      {rows.length === 0 && <p className={styles.muted}>등록된 링크가 없습니다.</p>}
      <ol className={styles.linkRows}>
        {rows.map((row, index) => {
          const fieldId = `${labelId}-${row.id}`;
          return (
            <li key={row.id} className={styles.linkRow}>
              <label htmlFor={`${fieldId}-type`}>
                유형
                <select
                  id={`${fieldId}-type`}
                  name="link-kind"
                  defaultValue={row.kind}
                  aria-label={`링크 ${index + 1} 유형`}
                >
                  {allowedKinds.map((value) => (
                    <option key={value} value={value}>
                      {linkLabels[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor={`${fieldId}-url`}>
                주소
                <input
                  id={`${fieldId}-url`}
                  name="link-url"
                  data-link-id={row.id}
                  defaultValue={row.url}
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="url"
                  maxLength={2048}
                  placeholder="https://…"
                  aria-label={`링크 ${index + 1} 주소`}
                />
              </label>
              <button
                type="button"
                className={styles.danger}
                onClick={() => removeLink(index)}
                aria-label={`링크 ${index + 1} 삭제`}
              >
                삭제
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
