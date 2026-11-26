import { useEffect, useState } from 'react';

import type { ContentSummary } from '@/lib/cms/content-contract';
import type { HomeInput } from '@/lib/cms/home-contract';

import { adminRequest } from '../admin-request';
import { HomeRow, RowActions } from './editor-row';

import styles from '../styles.module.scss';

type ProjectChoice = Pick<ContentSummary, 'id' | 'name' | 'cohort' | 'state' | 'liveRevisionId'>;

export function ProjectEditor({
  projectIds,
  automaticProjects,
  onChange,
}: Pick<HomeInput, 'projectIds' | 'automaticProjects'> & {
  onChange: (update: Pick<HomeInput, 'projectIds'> | Pick<HomeInput, 'automaticProjects'>) => void;
}) {
  const [projects, setProjects] = useState<ProjectChoice[]>();
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [retry, setRetry] = useState(0);
  const byId = new Map(projects?.map((project) => [project.id, project]));
  const matching = projects?.filter(
    (project) =>
      !projectIds.includes(project.id) &&
      `${project.name} ${project.cohort ?? ''}기`
        .toLocaleLowerCase('ko')
        .includes(query.trim().toLocaleLowerCase('ko')),
  );
  useEffect(() => {
    if (automaticProjects || projects) return;
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
  }, [automaticProjects, projects, retry]);

  return (
    <div className={styles.homeFields}>
      <label>
        <input
          type="checkbox"
          checked={automaticProjects}
          onChange={(event) => onChange({ automaticProjects: event.target.checked })}
        />
        썸네일이 있는 최신 기수 프로젝트 자동 표시
      </label>
      {!automaticProjects && (
        <>
          <p className={styles.muted}>
            최대 20개까지 선택할 수 있습니다. 공개 중이며 썸네일이 있는 프로젝트가 홈에 표시됩니다.
          </p>
          {error && (
            <p role="alert" className={styles.error}>
              {error}{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setRetry(retry + 1);
                }}
              >
                다시 불러오기
              </button>
            </p>
          )}
          {!error && !projects && <p role="status">프로젝트 목록을 불러오는 중입니다.</p>}
          {projectIds.map((id, index) => {
            const project = byId.get(id);
            return (
              <HomeRow
                key={id}
                label={project ? `${project.name} · ${project.cohort ?? ''}기` : '연결된 프로젝트'}
                actions={
                  <RowActions rows={projectIds} index={index} onChange={(projectIds) => onChange({ projectIds })} />
                }
              />
            );
          })}
          {projects && projectIds.length < 20 && (
            <div className={styles.mediaSlot}>
              <label>
                프로젝트 이름 또는 기수 검색{' '}
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              {matching?.length ? (
                <ul className={`${styles.mediaRows} ${styles.projectPickerResults}`}>
                  {matching.map(({ id, name, cohort, state, liveRevisionId }) => (
                    <li key={id} className={styles.mediaRow}>
                      <div className={styles.projectIdentity}>
                        <strong>{name}</strong>
                        <small>
                          {cohort}기 · {state === 'published' || liveRevisionId != null ? '공개 중' : '비공개'}
                        </small>
                      </div>
                      <button
                        type="button"
                        aria-label={`${name} ${cohort}기 추가`}
                        onClick={() => onChange({ projectIds: [...projectIds, id] })}
                      >
                        추가
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p role="status">추가할 프로젝트가 없습니다.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
