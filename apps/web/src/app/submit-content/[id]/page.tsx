import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { submissionsEnabled } from '@/lib/cms/submissions';

import SubmissionEditor from './submission-editor';

export const metadata: Metadata = {
  title: 'DND 콘텐츠 제출',
  description: 'DND에서 발급한 링크로 콘텐츠를 작성하고 제출하세요.',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!submissionsEnabled()) notFound();
  return <SubmissionEditor id={(await params).id} />;
}
