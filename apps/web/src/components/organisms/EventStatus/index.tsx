'use client';

import 'dayjs/locale/ko';

import type { EventStatus as Event } from '@dnd-academy/core';
import { Badge } from '@dnd-academy/ui';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import useCountdown from '@/hooks/useCountdown';
import useCurrentTime from '@/hooks/useCurrentTime';
import { CURRENT_FLAG } from '@/lib/constants';

dayjs.extend(relativeTime);
dayjs.locale('ko');

type Props = {
  eventStatus: Event;
};

function EventStatus({ eventStatus }: Props) {
  const { applicationStartDateTime, applicationEndDateTime, applicantAcceptanceDateTime, status } = eventStatus;

  const applicationStartDate = dayjs(applicationStartDateTime);
  const applicationEndDate = dayjs(applicationEndDateTime);
  const acceptanceDate = dayjs(applicantAcceptanceDateTime);

  const applicationStartDateCountdown = useCountdown(applicationStartDateTime);
  const applicationEndDateCountdown = useCountdown(applicationEndDateTime);

  const currentTime = useCurrentTime(
    !(applicationStartDateCountdown === 'END' && applicationEndDateCountdown === 'END'),
  );

  if (dayjs(currentTime).isBefore(applicationStartDate)) {
    return <Badge label={`DND는 ${CURRENT_FLAG}기 모집까지 ${applicationStartDateCountdown}`} variant="notice" />;
  }

  if (status === 'HOT') {
    return <Badge label={eventStatus.label || 'DND는 문의 폭주 🔥🔥🔥'} variant="error" />;
  }

  if (status === 'INACTIVE') {
    return <Badge label={eventStatus.label || 'DND는 휴가중 🏖'} variant="info" />;
  }

  if (dayjs(currentTime).isBefore(applicationEndDate)) {
    return <Badge label={`DND는 ${CURRENT_FLAG}기 모집 마감까지 ${applicationEndDateCountdown}`} variant="success" />;
  }

  if (dayjs(currentTime).isBefore(acceptanceDate)) {
    return <Badge label={`${acceptanceDate.format('MM월 DD일 (ddd)')} 모집 발표 📢`} variant="success" />;
  }

  if (status === 'ACTIVE') {
    return <Badge label={eventStatus.label || `DND는 ${CURRENT_FLAG}기 진행중`} variant="success" />;
  }
}

export default EventStatus;
