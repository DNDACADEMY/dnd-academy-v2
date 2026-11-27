import type { Metadata } from 'next';
import Link from 'next/link';

import { DNDLogo } from '@/lib/assets/logos';
import { readAdmissions } from '@/lib/cms/admissions';
import { contentWorkspace, editableContent } from '@/lib/cms/content';
import { contentKinds } from '@/lib/cms/content-contract';
import { editableHome } from '@/lib/cms/home';
import { adminSession } from '@/lib/cms/permissions';
import { readRecruitmentControls } from '@/lib/cms/recruitment';
import { submissionsEnabled, submissionWorkspace } from '@/lib/cms/submissions';

import { signOut } from './actions';
import AdmissionsPanel from './admissions-panel';
import ContentPanel from './content-panel';
import HomePanel from './home-panel';
import AdminLinkStatus from './link-status';
import LoginForm from './login-form';
import SubmissionsPanel from './submissions-panel';

import styles from './styles.module.scss';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'DND 관리자', robots: { index: false, follow: false } };

type Props = {
  searchParams: Promise<{
    login?: string;
    kind?: string;
    id?: string;
    section?: string;
    cohort?: string;
    target?: string;
  }>;
};
const contentLabels = { project: '프로젝트', organizer: '운영진', review: '후기' };

export default async function Admin({ searchParams }: Props) {
  const query = await searchParams;
  const session = await adminSession();
  if (!session?.permissions.length) {
    return (
      <div className={`${styles.admin} ${styles.loginLayout}`} data-admin-workspace>
        <aside className={styles.loginBrand}>
          <Link href="/" className={styles.brand}>
            <span>
              <DNDLogo aria-hidden="true" />
            </span>{' '}
            DND
          </Link>
          <div>
            <p>운영진 전용</p>
            <h1>DND 관리자</h1>
            <p>모집과 홈페이지 콘텐츠를 관리하는 공간입니다.</p>
          </div>
          <Link href="/" className={styles.backLink}>
            홈페이지로 돌아가기 ↗
          </Link>
        </aside>
        <section className={styles.loginCard}>
          <h2>{session ? '접근 권한이 필요합니다' : '관리자 로그인'}</h2>
          <p className={styles.muted}>
            {session ? '모집 또는 콘텐츠 관리 권한을 확인해 주세요.' : '등록된 운영진 계정으로 로그인하세요.'}
          </p>
          {query.login === 'failed' && (
            <p role="alert" className={styles.error}>
              이메일, 비밀번호와 관리자 권한을 확인해 주세요.
            </p>
          )}
          {session ? (
            <form action={signOut}>
              <button>로그아웃</button>
            </form>
          ) : (
            <LoginForm disabled={!process.env.DND_SUPABASE_URL} />
          )}
          {!process.env.DND_SUPABASE_URL && <p className={styles.muted}>관리자 서비스 연결을 준비 중입니다.</p>}
        </section>
      </div>
    );
  }

  const hasAdmissions = session.permissions.includes('admissions');
  const hasContent = session.permissions.includes('content');
  const showHome = hasContent && query.section === 'home';
  const canUseSubmissions = hasContent && submissionsEnabled();
  const showSubmissions = canUseSubmissions && query.section === 'submissions';
  const showAdmissions =
    hasAdmissions && (!hasContent || (!showHome && !showSubmissions && query.section !== 'content'));
  const kind = contentKinds.find((value) => value === query.kind) ?? 'project';
  const id =
    query.id && /^(0|[1-9]\d{0,9})$/.test(query.id) && Number(query.id) <= 2147483647 ? Number(query.id) : null;
  const admissions = showAdmissions ? await Promise.all([readAdmissions(session.id), readRecruitmentControls()]) : null;
  const workspace = showAdmissions || showHome || showSubmissions ? null : await contentWorkspace(session.id, kind, id);
  const targetId =
    showSubmissions && query.target && /^(0|[1-9]\d{0,9})$/.test(query.target) && Number(query.target) <= 2147483647
      ? Number(query.target)
      : null;
  const [submissionTarget] = targetId === null ? [] : await editableContent(session.id, kind, targetId);
  const submissionCohort =
    query.cohort && /^[1-9]\d{0,3}$/.test(query.cohort) ? Number(query.cohort) : (submissionTarget?.cohort ?? null);
  const submissions = showSubmissions ? await submissionWorkspace(session.id, submissionCohort) : null;
  return (
    <div className={`${styles.admin} ${styles.workspace}`} data-admin-workspace>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          <span>
            <DNDLogo aria-hidden="true" />
          </span>
          <strong>DND 관리자</strong>
        </Link>
        <nav aria-label="관리 메뉴">
          {hasAdmissions && (
            <Link href="/admin?section=admissions" aria-current={showAdmissions ? 'page' : undefined}>
              모집 관리 <AdminLinkStatus />
            </Link>
          )}
          {hasContent && (
            <div className={styles.navGroup}>
              <Link href="/admin?section=content" data-section-current={!showAdmissions || undefined}>
                콘텐츠 관리 <AdminLinkStatus />
              </Link>
              <Link className={styles.navChild} href="/admin?section=home" aria-current={showHome ? 'page' : undefined}>
                홈 관리 <AdminLinkStatus />
              </Link>
              {canUseSubmissions && (
                <Link
                  className={styles.navChild}
                  href="/admin?section=submissions"
                  aria-current={showSubmissions ? 'page' : undefined}
                >
                  제출 관리 <AdminLinkStatus />
                </Link>
              )}
              {contentKinds.map((value) => (
                <Link
                  className={styles.navChild}
                  key={value}
                  href={`/admin?section=content&kind=${value}`}
                  aria-current={!showAdmissions && !showHome && !showSubmissions && kind === value ? 'page' : undefined}
                >
                  {contentLabels[value]} <AdminLinkStatus />
                </Link>
              ))}
            </div>
          )}
        </nav>
        <Link href="/" className={styles.sidebarFooter}>
          홈페이지 보기 ↗
        </Link>
      </aside>
      <section className={styles.workArea}>
        <header className={styles.topbar}>
          <span>
            {showAdmissions
              ? '모집 관리'
              : showHome
                ? '콘텐츠 관리 / 홈'
                : showSubmissions
                  ? '콘텐츠 관리 / 제출'
                  : `콘텐츠 관리 / ${contentLabels[kind]}`}
          </span>
          <form action={signOut}>
            <button className={styles.quiet}>로그아웃</button>
          </form>
        </header>
        <div className={styles.canvas}>
          {admissions ? (
            <AdmissionsPanel initial={admissions[0]} recruitment={admissions[1]} />
          ) : submissions ? (
            <SubmissionsPanel
              key={submissions.cohortId}
              workspace={submissions}
              target={
                submissionTarget
                  ? {
                      id: submissionTarget.id,
                      kind,
                      name: submissionTarget.name,
                      projectId: submissionTarget.projectId,
                    }
                  : undefined
              }
            />
          ) : showHome ? (
            <HomePanel initial={await editableHome(session.id)} />
          ) : (
            workspace && (
              <ContentPanel
                key={kind}
                kind={kind}
                rows={workspace.rows}
                initial={workspace.initial ?? undefined}
                create={query.id === 'new'}
                submissionLinks={canUseSubmissions}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}
