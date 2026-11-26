'use client';

import { useEffect, useRef, useState } from 'react';

import type { ContentSummary } from '@/lib/cms/content-contract';

import { adminRequest } from './admin-request';

import styles from './styles.module.scss';

type ProjectChoice = Pick<ContentSummary, 'id' | 'name' | 'cohort' | 'state' | 'liveRevisionId'>;

function ProjectIdentity({ project }: { project: ProjectChoice }) {
  const state =
    project.state === 'draft'
      ? project.liveRevisionId != null
        ? '수정 초안 있음'
        : '게시 전'
      : project.state === 'archived'
        ? '비공개'
        : '공개 중';
  return (
    <div className={styles.projectIdentity}>
      <strong>{project.name}</strong>
      <small>{[project.cohort && `${project.cohort}기`, state].filter(Boolean).join(' · ')}</small>
    </div>
  );
}

export default function ReviewProjectPicker({
  value,
  fallback,
  onChange,
}: {
  value: number | null;
  fallback?: string;
  onChange: (id: number | null) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [opened, setOpened] = useState(false);
  const [requested, setRequested] = useState(value !== null);
  const [projects, setProjects] = useState<ProjectChoice[]>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [cohort, setCohort] = useState<number>();
  const selected = projects?.find(({ id }) => id === value);
  const cohorts = [...new Set(projects?.flatMap(({ cohort }) => (cohort ? [cohort] : [])))].toSorted((a, b) => b - a);
  const terms = query.trim().normalize('NFC').toLowerCase().split(/\s+/).filter(Boolean);
  const results = projects
    ?.filter(
      (project) =>
        (cohort === undefined || project.cohort === cohort) &&
        terms.every((term) =>
          `${project.name} ${project.cohort ? `${project.cohort}기` : ''}`
            .normalize('NFC')
            .toLowerCase()
            .includes(term),
        ),
    )
    .toSorted((a, b) => (b.cohort ?? 0) - (a.cohort ?? 0) || a.name.localeCompare(b.name, 'ko') || a.id - b.id);

  useEffect(() => {
    if (!requested) return;
    let active = true;
    void adminRequest<{ projects: ProjectChoice[] }>('content/projects', {})
      .then(({ projects }) => {
        if (active) setProjects(projects);
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [requested, retry]);

  useEffect(() => {
    if (opened && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
      searchRef.current?.focus();
    }
  }, [opened]);

  function show() {
    setRequested(true);
    setQuery('');
    setCohort(undefined);
    setOpened(true);
  }

  return (
    <section className={styles.mediaSlot} aria-label="연결 프로젝트">
      <div className={styles.mediaSlotHeading}>
        <h4>연결 프로젝트</h4>
        <button type="button" onClick={show}>
          {value === null ? '프로젝트 선택' : '프로젝트 변경'}
        </button>
      </div>
      {selected ? (
        <ProjectIdentity project={selected} />
      ) : (
        <p className={styles.muted}>
          {value === null
            ? '연결된 프로젝트가 없습니다.'
            : fallback ||
              (projects || error ? '연결된 프로젝트를 확인할 수 없습니다.' : '연결된 프로젝트를 불러오는 중…')}
        </p>
      )}
      {value !== null && (
        <button type="button" className={`${styles.quiet} ${styles.unlinkProject}`} onClick={() => onChange(null)}>
          프로젝트 연결 해제
        </button>
      )}
      <p className={styles.muted}>공개 중인 프로젝트를 연결하면 후기에 상세 페이지 링크가 표시됩니다.</p>
      {opened && (
        <dialog
          ref={dialogRef}
          className={styles.mediaDialog}
          aria-labelledby="review-project-picker-title"
          onClose={() => setOpened(false)}
          onChange={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && event.target instanceof HTMLInputElement) event.preventDefault();
          }}
        >
          <header className={styles.mediaDialogHeading}>
            <h3 id="review-project-picker-title">후기에 연결할 프로젝트</h3>
            <button type="button" onClick={() => dialogRef.current?.close()}>
              닫기
            </button>
          </header>
          <div className={styles.projectPicker}>
            <div className={styles.projectPickerFilters}>
              <label>
                프로젝트 이름 또는 기수
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  placeholder="예: 16기 또는 프로젝트 이름"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label>
                프로젝트 기수
                <select
                  value={cohort ?? ''}
                  onChange={(event) => setCohort(event.target.value ? Number(event.target.value) : undefined)}
                >
                  <option value="">전체 기수</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort} value={cohort}>
                      {cohort}기
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error && (
              <div className={styles.buttons}>
                <p role="alert" className={styles.error}>
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setRetry(retry + 1);
                  }}
                >
                  다시 불러오기
                </button>
              </div>
            )}
            {!projects && !error && <p role="status">프로젝트를 불러오는 중입니다.</p>}
            {results &&
              (results.length ? (
                <ul className={`${styles.mediaRows} ${styles.projectPickerResults}`}>
                  {results.map((project) => (
                    <li key={project.id} className={styles.mediaRow}>
                      <ProjectIdentity project={project} />
                      <button
                        type="button"
                        disabled={project.id === value}
                        aria-label={[
                          project.name,
                          project.cohort && `${project.cohort}기`,
                          project.id === value ? '연결됨' : '선택',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => {
                          onChange(project.id);
                          dialogRef.current?.close();
                        }}
                      >
                        {project.id === value ? '연결됨' : '선택'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p role="status">조건에 맞는 프로젝트가 없습니다.</p>
              ))}
          </div>
        </dialog>
      )}
    </section>
  );
}
