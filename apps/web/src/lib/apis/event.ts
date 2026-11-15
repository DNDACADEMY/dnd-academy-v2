import { CurrentApplicantCount, EventStatus } from '@dnd-academy/core';

import { applicantCountData, eventStatusData } from '../assets/data';

export const getEventStatus = (): EventStatus => {
  const event = eventStatusData as EventStatus;

  if (
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' &&
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'develop' &&
    event.applicationStartDateTime === '2026/11/16 00:00:00'
  ) {
    return { ...event, applicationStartDateTime: '2026/11/15 17:00:00' };
  }

  return event;
};

export const getApplicantCount = () => applicantCountData as CurrentApplicantCount;
