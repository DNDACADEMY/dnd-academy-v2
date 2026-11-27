'use client';

import { useEffect, useId, useRef, useState } from 'react';

import TechnologyTag from '@/components/atoms/TechnologyTag';
import { maxSkillLabelLength, maxSkills } from '@/lib/cms/content-contract';

import { adminRequest } from './admin-request';

import styles from './styles.module.scss';

const resultLimit = 8;

function searchKey(label: string) {
  return label.trim().normalize('NFC').toLowerCase();
}

const adminCatalog = () => adminRequest<{ skills: string[] }>('content/skills', {});

export default function SkillTagPicker({
  initial,
  value,
  onChange,
  loadCatalog = adminCatalog,
}: {
  onChange: (selected: string[]) => void;
  loadCatalog?: () => Promise<{ skills: string[] }>;
} & ({ initial: string[]; value?: never } | { value: string[]; initial?: never })) {
  const [localSelected, setLocalSelected] = useState(initial ?? []);
  const selected = value ?? localSelected;
  const [catalog, setCatalog] = useState<string[]>();
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLUListElement>(null);
  const inputId = useId();

  const proposedLabel = query.trim();
  const term = searchKey(proposedLabel);
  const atLimit = selected.length >= maxSkills;
  const selectedKeys = new Set(selected.map(searchKey));
  const matches =
    catalog && term
      ? [...new Map([...catalog, ...selected].map((label) => [searchKey(label), label])).values()].filter((label) =>
          searchKey(label).includes(term),
        )
      : [];
  const isSelected = (label: string) => selectedKeys.has(searchKey(label));
  const rank = (label: string) => {
    const key = searchKey(label);
    return key === term ? 0 : key.startsWith(term) ? 1 : 2;
  };
  const suggestions = matches.toSorted((a, b) => rank(a) - rank(b)).slice(0, resultLimit);
  const exact = suggestions.find((label) => rank(label) === 0 && !isSelected(label));
  const canCreate = Boolean(catalog && term) && !suggestions.some((label) => rank(label) === 0);

  useEffect(() => {
    if (!attempt) return;
    let active = true;
    void loadCatalog()
      .then(({ skills }) => {
        if (active) setCatalog(skills);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [attempt, loadCatalog]);

  function select(next: string[]) {
    if (value === undefined) setLocalSelected(next);
    onChange(next);
    search.current?.focus();
  }

  function add(label: string) {
    if (atLimit || isSelected(label)) return;
    setQuery('');
    select([...selected, label]);
  }

  return (
    <section
      className={styles.skillPicker}
      aria-label="기술 태그"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpened(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          search.current?.focus();
          setOpened(false);
        }
      }}
    >
      <label htmlFor={inputId}>기술 태그</label>
      {selected.length > 0 && (
        <ul aria-label="선택한 기술" className={styles.selectedSkills}>
          {selected.map((label) => (
            <li key={label}>
              <input type="hidden" name="skills" value={label} />
              <TechnologyTag skill={label} color="grey" />
              <button
                type="button"
                aria-label={`${label} 태그 제거`}
                onClick={() => select(selected.filter((skill) => skill !== label))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={inputId}
        ref={search}
        type="search"
        value={query}
        maxLength={maxSkillLabelLength}
        placeholder="기술 이름 검색 또는 새 태그 입력"
        disabled={atLimit}
        onFocus={() => {
          setOpened(true);
          if (!attempt) setAttempt(1);
        }}
        onChange={(event) => {
          event.stopPropagation();
          setOpened(true);
          setQuery(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          if (event.key === 'ArrowDown' && opened && term) {
            const first = results.current?.querySelector<HTMLButtonElement>('button:not(:disabled)');
            if (first) {
              event.preventDefault();
              first.focus();
            }
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            if (!opened || atLimit) return;
            if (exact) add(exact);
            else if (canCreate && suggestions.length === 0) add(proposedLabel);
          }
        }}
      />
      {atLimit && <p className={styles.muted}>기술은 최대 {maxSkills}개까지 추가할 수 있습니다.</p>}
      {opened && !atLimit && (
        <>
          {!catalog && !error && (
            <p role="status" className={styles.muted}>
              기술 태그를 불러오는 중입니다.
            </p>
          )}
          {error && (
            <div className={styles.buttons}>
              <p role="alert" className={styles.error}>
                {error}
              </p>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setError('');
                  setAttempt(attempt + 1);
                }}
              >
                다시 불러오기
              </button>
            </div>
          )}
          {catalog && term && (
            <ul
              ref={results}
              aria-label="기술 검색 결과"
              className={styles.skillResults}
              onMouseDown={(event) => {
                // Safari may blur the input before a clicked result button receives focus.
                if (event.target instanceof Element && event.target.closest('button')) event.preventDefault();
              }}
            >
              {suggestions.map((label) => (
                <li key={label}>
                  <button
                    type="button"
                    aria-label={`${label} ${isSelected(label) ? '추가됨' : '추가'}`}
                    disabled={isSelected(label)}
                    onClick={() => add(label)}
                  >
                    <TechnologyTag skill={label} color="grey" />
                    <span>{isSelected(label) ? '추가됨' : '추가'}</span>
                  </button>
                </li>
              ))}
              {canCreate && (
                <li>
                  <button type="button" aria-label={`${proposedLabel} 새 태그 추가`} onClick={() => add(proposedLabel)}>
                    <span>{proposedLabel}</span>
                    <span>새 태그 추가</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
