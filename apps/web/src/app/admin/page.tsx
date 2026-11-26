import type { Metadata } from 'next';

import { readAdmissions } from '@/lib/cms/admissions';
import { editableContent } from '@/lib/cms/content';
import { contentKinds } from '@/lib/cms/content-contract';
import { adminSession } from '@/lib/cms/permissions';

import { signIn, signOut } from './actions';
import AdmissionsPanel from './admissions-panel';
import ContentPanel from './content-panel';

import styles from './styles.module.scss';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'DND 관리자', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ login?: string; kind?: string; id?: string; section?: string }> };

export default async function Admin({ searchParams }: Props) {
  const query = await searchParams;
  const session = await adminSession();
  if (!session?.permissions.length) {
    return (
      <section className={styles.admin}>
        <h1>DND 관리자</h1>
        {query.login === 'failed' && <p role="alert">등록된 관리자 계정과 권한을 확인해 주세요.</p>}
        {session ? (
          <form action={signOut}>
            <button>로그아웃</button>
          </form>
        ) : (
          <form action={signIn} className={styles.form}>
            <label>
              이메일 <input name="email" type="email" autoComplete="username" required />
            </label>
            <label>
              비밀번호 <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button disabled={!process.env.DND_SUPABASE_URL}>로그인</button>
          </form>
        )}
        {!process.env.DND_SUPABASE_URL && <p>관리자 서비스 연결을 준비 중입니다.</p>}
      </section>
    );
  }
  const hasAdmissions = session.permissions.includes('admissions');
  const hasContent = session.permissions.includes('content');
  const showAdmissions = hasAdmissions && (query.section !== 'content' || !hasContent);
  const kind = contentKinds.find((value) => value === query.kind) ?? 'project';
  const id =
    query.id && /^(0|[1-9]\d{0,9})$/.test(query.id) && Number(query.id) <= 2147483647 ? Number(query.id) : null;
  const rows = showAdmissions ? null : await editableContent(session.id, kind);
  return (
    <section className={styles.admin}>
      <header>
        <h1>DND 관리자</h1>
        <form action={signOut}>
          <button>로그아웃</button>
        </form>
      </header>
      <nav aria-label="관리 메뉴">
        {hasAdmissions && <a href="/admin?section=admissions">모집 관리</a>}
        {hasContent && <a href="/admin?section=content">콘텐츠 관리</a>}
      </nav>
      {showAdmissions ? (
        <AdmissionsPanel initial={await readAdmissions(session.id)} />
      ) : (
        rows && (
          <ContentPanel key={`${kind}:${id}`} kind={kind} rows={rows} initial={rows.find((row) => row.id === id)} />
        )
      )}
    </section>
  );
}
