'use client';

import { useEffect, useRef, useState } from 'react';

import type { ContentKind } from '@/lib/cms/content-contract';
import { type SubmissionContentMatch, submissionLabels } from '@/lib/cms/submission-contract';

import { adminRequest } from './admin-request';

import styles from './submissions.module.scss';

type Props = {
  kind: ContentKind;
  cohort?: number;
  selected: SubmissionContentMatch | null;
  onSelect: (item: SubmissionContentMatch | null) => void;
  disabled: boolean;
};

export default function SubmissionContentPicker({ kind, cohort, selected, onSelect, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<SubmissionContentMatch[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const active = useRef<AbortController | null>(null);

  useEffect(() => () => active.current?.abort(), []);

  async function search() {
    if (disabled || pending) return;
    const controller = new AbortController();
    active.current?.abort();
    active.current = controller;
    setMatches(null);
    setPending(true);
    setError('');
    try {
      const results = await adminRequest<SubmissionContentMatch[]>(
        'submissions',
        { action: 'lookup', kind, query, cohort },
        controller.signal,
      );
      if (!controller.signal.aborted) setMatches(results);
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(reason instanceof Error ? reason.message : '검색 결과를 불러오지 못했습니다.');
    } finally {
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <>
      <div className={styles.formRow}>
        <label>
          기존 {submissionLabels[kind]} 검색
          <input
            value={query}
            placeholder="콘텐츠 이름"
            maxLength={160}
            onChange={(event) => {
              active.current?.abort();
              setPending(false);
              setMatches(null);
              setError('');
              setQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void search();
              }
            }}
          />
        </label>
        <button type="button" disabled={disabled || pending} onClick={() => void search()}>
          {pending ? '검색 중…' : '검색'}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {matches &&
        (matches.length ? (
          <label>
            검색 결과
            <select
              value={matches.some((item) => item.id === selected?.id) ? selected?.id : ''}
              onChange={(event) => onSelect(matches.find((item) => String(item.id) === event.target.value) ?? null)}
            >
              <option value="">항목 선택</option>
              {matches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className={styles.muted}>검색 결과가 없습니다.</p>
        ))}
      {selected && <p className={styles.selection}>수정 대상 · {selected.name}</p>}
    </>
  );
}
