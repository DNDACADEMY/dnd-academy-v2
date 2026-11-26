import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import HomePage from '@/components/pages/HomePage';
import { getApplicantCount, getEventStatus } from '@/lib/apis/event';
import { editableHome, homePresentation } from '@/lib/cms/home';
import { adminSession } from '@/lib/cms/permissions';

import styles from '../styles.module.scss';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '홈 초안 미리보기', robots: { index: false, follow: false } };

export default async function HomePreview() {
  const session = await adminSession();
  if (!session?.permissions.includes('content')) notFound();
  const draft = await editableHome(session.id);
  if (!draft) notFound();
  const content = await homePresentation(draft.input, true);
  return (
    <>
      <aside className={styles.homePreviewBanner}>
        <strong>홈 초안 미리보기</strong>
        <Link href="/admin?section=home">홈 편집으로 돌아가기</Link>
      </aside>
      <HomePage
        applicantTotalCount={getApplicantCount().total}
        eventStatus={getEventStatus()}
        faqItems={content.faqs}
        content={content}
      />
    </>
  );
}
