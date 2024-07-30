import { ReactNode } from 'react';

import { PageTitle } from '@dnd-academy/ui';

import ShareAlarmSection from '@/components/organisms/ShareAlarmSection';

type Props = {
  children: ReactNode;
};

function JobsTemplate({ children }: Props) {
  return (
    <>
      <PageTitle title="채용" subTitle="지금, 열정이 넘치는 참가자가 가득한 DND의 채용 공고를 확인하세요!" />
      {children}
      <ShareAlarmSection />
    </>
  );
}

export default JobsTemplate;
