'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import type { ContentSummary, MediaItem } from '@/lib/cms/content-contract';
import { homeInput, type HomeInput, type HomeWorkspace } from '@/lib/cms/home-contract';

import { adminRequest } from './admin-request';

import styles from './styles.module.scss';

const MediaPanel = dynamic(() => import('./media-panel'), { ssr: false });
const tabs = { faqs: 'FAQ', sponsors: '후원사', projectIds: '프로젝트 슬라이더', stats: '누적 실적' } as const;
type Tab = keyof typeof tabs;
type ProjectChoice = Pick<ContentSummary, 'id' | 'name' | 'cohort' | 'state' | 'liveRevisionId'>;

export default function HomePanel({ initial }: { initial: HomeWorkspace | null }) {
  if (!initial) {
    return (
      <section className={styles.card}>
        <h1>홈 관리</h1>
        <p>기존 홈페이지 콘텐츠 이관이 필요합니다.</p>
      </section>
    );
  }
  return <Editor initial={initial} />;
}

function Editor({ initial }: { initial: HomeWorkspace }) {
  const [workspace, setWorkspace] = useState(initial);
  const [input, setInput] = useState(initial.input);
  const [tab, setTab] = useState<Tab>('faqs');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function change(update: Partial<HomeInput>) {
    setInput((previous) => ({ ...previous, ...update }));
    setDirty(true);
    setError('');
    setNotice('');
  }

  async function submit(action: 'save' | 'publish') {
    setNotice('');
    setError('');
    const valid = homeInput.safeParse(input);
    if (!valid.success) {
      const field = valid.error.issues[0]?.path[0];
      setTab(field === 'sponsorInfo' ? 'sponsors' : field && field in tabs ? (field as Tab) : tab);
      setError('필수 항목, 링크 주소, 후원사 로고를 확인해 주세요.');
      return;
    }
    setBusy(true);
    try {
      const saved = await adminRequest<HomeWorkspace>('home', {
        action,
        revisionId: workspace.revisionId,
        ...(action === 'save' ? { input: valid.data } : {}),
      });
      setWorkspace(saved);
      setInput(saved.input);
      setDirty(false);
      setNotice(action === 'save' ? '홈 초안을 저장했습니다.' : '홈에 게시했습니다.');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className={styles.pageHeading}>
        <div>
          <h1>홈 관리</h1>
          <p>네 섹션을 편집하고, 저장한 초안을 미리 본 뒤 홈에 게시하세요.</p>
        </div>
        <Link href="/admin/home-preview" className={styles.primary} target="_blank">
          저장한 초안 미리보기 ↗
        </Link>
      </div>
      <div className={styles.card}>
        <div className={styles.tabs} aria-label="홈 섹션">
          {(Object.entries(tabs) as [Tab, string][]).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}>
              {label}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className={styles.status}>
            {notice}
          </p>
        )}
        <fieldset disabled={busy}>
          {tab === 'faqs' && <FaqEditor rows={input.faqs} onChange={(faqs) => change({ faqs })} />}
          {tab === 'sponsors' && <SponsorEditor input={input} onChange={change} />}
          {tab === 'projectIds' && <ProjectEditor input={input} onChange={change} />}
          {tab === 'stats' && <Statistics rows={input.stats} onChange={(stats) => change({ stats })} />}
        </fieldset>
        <footer className={styles.editorFooter}>
          <span className={styles.muted}>
            {dirty
              ? '저장하지 않은 변경 사항'
              : workspace.revisionId !== workspace.publishedId
                ? '게시 대기 중인 초안'
                : '현재 게시본'}
          </span>
          <div className={styles.buttons}>
            <button type="button" disabled={busy || !dirty} onClick={() => void submit('save')}>
              초안 저장
            </button>
            <button
              type="button"
              className={styles.primary}
              disabled={busy || dirty || workspace.publishedId === workspace.revisionId}
              onClick={() => {
                if (window.confirm('저장한 홈 초안을 게시할까요?')) void submit('publish');
              }}
            >
              홈 게시
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}

function insertAt<T>(rows: T[], index: number, value: T) {
  return rows.map((item, i) => (i === index ? value : item));
}

function RowActions<T>({ rows, index, onChange }: { rows: T[]; index: number; onChange: (rows: T[]) => void }) {
  function move(offset: number) {
    const reordered = [...rows];
    [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]];
    onChange(reordered);
  }
  return (
    <div className={styles.buttons}>
      <button type="button" aria-label={`항목 ${index + 1} 위로`} disabled={index === 0} onClick={() => move(-1)}>
        ↑
      </button>
      <button
        type="button"
        aria-label={`항목 ${index + 1} 아래로`}
        disabled={index + 1 === rows.length}
        onClick={() => move(1)}
      >
        ↓
      </button>
      <button
        type="button"
        className={styles.danger}
        aria-label={`항목 ${index + 1} 삭제`}
        onClick={() => onChange(rows.filter((_, i) => i !== index))}
      >
        삭제
      </button>
    </div>
  );
}

function HomeRow({ label, actions, children }: { label: string; actions: ReactNode; children?: ReactNode }) {
  return (
    <section className={styles.mediaSlot} aria-label={label}>
      <div className={styles.mediaSlotHeading}>
        <h4>{label}</h4>
        {actions}
      </div>
      {children}
    </section>
  );
}

function FaqEditor({ rows, onChange }: { rows: HomeInput['faqs']; onChange: (rows: HomeInput['faqs']) => void }) {
  return (
    <div className={styles.homeFields}>
      <div className={styles.mediaSlotHeading}>
        <h3>FAQ {rows.length}개</h3>
        <button
          type="button"
          disabled={rows.length === 100}
          onClick={() => onChange([...rows, { question: '', answer: '', visible: true }])}
        >
          질문 추가
        </button>
      </div>
      <p className={styles.muted}>공개한 질문이 없으면 홈페이지에서 FAQ 섹션이 숨겨집니다.</p>
      {rows.map((row, index) => {
        const update = (value: Partial<typeof row>) => onChange(insertAt(rows, index, { ...row, ...value }));
        return (
          <HomeRow
            key={index}
            label={row.question || '새 질문'}
            actions={<RowActions rows={rows} index={index} onChange={onChange} />}
          >
            <label>
              질문{' '}
              <input
                value={row.question}
                maxLength={300}
                onChange={(event) => update({ question: event.target.value })}
              />
            </label>
            <label>
              답변{' '}
              <textarea
                value={row.answer}
                maxLength={8000}
                onChange={(event) => update({ answer: event.target.value })}
              />
            </label>
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
    </div>
  );
}

function SponsorEditor({ input, onChange }: { input: HomeInput; onChange: (update: Partial<HomeInput>) => void }) {
  const { sponsors, sponsorInfo } = input;
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
          onChange({ sponsors: insertAt(sponsors, index, { ...row, ...value }) });
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
              onChange({ sponsors: insertAt(sponsors, logoRow, { ...sponsors[logoRow], mediaId, logoPath: null }) });
              dialog.current?.close();
            }}
          />
        </dialog>
      )}
    </div>
  );
}

function ProjectEditor({ input, onChange }: { input: HomeInput; onChange: (update: Partial<HomeInput>) => void }) {
  const [projects, setProjects] = useState<ProjectChoice[]>();
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [retry, setRetry] = useState(0);
  const { projectIds, automaticProjects } = input;
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

const statsLabels = {
  cumulativeApplicants: '누적 지원자 수',
  totalParticipants: '총 참가자 수',
  totalProjects: '총 프로젝트 수',
  dropoutCohort: '이탈자 집계 기수',
  dropouts: '이탈자 수',
} as const;

function Statistics({ rows, onChange }: { rows: HomeInput['stats']; onChange: (stats: HomeInput['stats']) => void }) {
  return (
    <div className={styles.homeFields}>
      <p className={styles.muted}>총 프로젝트 수는 누적 실적으로 집계합니다. 공개 프로젝트 목록과 별도로 관리하세요.</p>
      <div className={styles.grid}>
        {(Object.entries(statsLabels) as [keyof typeof statsLabels, string][]).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={key === 'dropoutCohort' ? 1 : 0}
              value={rows[key]}
              onChange={(event) => onChange({ ...rows, [key]: Number(event.target.value) })}
            />
          </label>
        ))}
        <label>
          집계 기준일{' '}
          <input
            type="date"
            value={rows.asOf ?? ''}
            onChange={(event) => onChange({ ...rows, asOf: event.target.value || null })}
          />
        </label>
      </div>
    </div>
  );
}
