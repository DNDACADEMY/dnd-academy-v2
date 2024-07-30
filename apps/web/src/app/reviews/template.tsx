import { ReactNode } from 'react';

import { PageTitle } from '@dnd-academy/ui';

import ShareAlarmSection from '@/components/organisms/ShareAlarmSection';

type Props = {
  children: ReactNode;
};

function ReviewsTemplate({ children }: Props) {
  return (
    <>
      <PageTitle title="후기" subTitle="지금 참가자들의 따끈한 후기를 확인해 보세요!" />
      {children}
      <ShareAlarmSection />
    </>
  );
}

export default ReviewsTemplate;
