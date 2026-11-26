'use client';

import Link from 'next/link';
import { useState } from 'react';

import { homeInput, type HomeInput, type HomeWorkspace } from '@/lib/cms/home-contract';

import { adminRequest } from './admin-request';
import { FaqEditor } from './home/faq-editor';
import { ProjectEditor } from './home/project-editor';
import { SponsorEditor } from './home/sponsor-editor';
import { Statistics } from './home/statistics';
import { useUnsavedChanges } from './use-unsaved-changes';

import styles from './styles.module.scss';

const tabs = { faqs: 'FAQ', sponsors: '후원사', projectIds: '프로젝트 슬라이더', stats: '누적 실적' } as const;
type Tab = keyof typeof tabs;

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

  useUnsavedChanges(dirty);

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
          {tab === 'sponsors' && (
            <SponsorEditor sponsors={input.sponsors} sponsorInfo={input.sponsorInfo} onChange={change} />
          )}
          {tab === 'projectIds' && (
            <ProjectEditor
              projectIds={input.projectIds}
              automaticProjects={input.automaticProjects}
              onChange={change}
            />
          )}
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
