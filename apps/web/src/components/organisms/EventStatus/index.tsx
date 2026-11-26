'use client';

import 'dayjs/locale/ko';
import type { EventStatus as Event } from '@dnd-academy/core';
import { Badge } from '@dnd-academy/ui';

import { useRecruitment } from '@/components/global/RecruitmentProvider';
import useCountdown from '@/hooks/useCountdown';
import { CURRENT_FLAG } from '@/lib/constants';
import { parseEventDateTime } from '@/utils/parseEventDateTime';

type Props = {
  eventStatus: Event;
};

function EventStatus({ eventStatus }: Props) {
  const recruitment = useRecruitment();
  const { applicationStartDateTime, applicationEndDateTime, applicantAcceptanceDateTime, status } = eventStatus;

  const applicationStartDateCountdown = useCountdown(applicationStartDateTime);
  const applicationEndDateCountdown = useCountdown(applicationEndDateTime);
  const acceptanceCountdown = useCountdown(applicantAcceptanceDateTime);

  if (recruitment.kind === 'unavailable') return null;
  if (recruitment.kind === 'configured') {
    const { settings, display } = recruitment;
    if (display.application === 'open') {
      return <Badge label={`DND ${settings.cohort}기 모집 중`} variant="success" />;
    }
    if (settings.applicationMode === 'auto' && display.applicationUpcoming) {
      const date = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(
        new Date(settings.startsAt),
      );
      return <Badge label={`${date} ${settings.cohort}기 모집 시작`} variant="notice" />;
    }
    if (settings.passboardMode === 'auto' && settings.announcement?.ready && display.announcementUpcoming) {
      const date = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(
        new Date(settings.announcement.startsAt),
      );
      return <Badge label={`${date} ${settings.cohort}기 모집 발표 📢`} variant="success" />;
    }
    return null;
  }

  if (applicationStartDateCountdown !== 'END') {
    return <Badge label={`DND는 ${CURRENT_FLAG}기 모집까지 ${applicationStartDateCountdown}`} variant="notice" />;
  }

  if (status === 'HOT') {
    return <Badge label={eventStatus.label || 'DND는 문의 폭주 🔥🔥🔥'} variant="error" />;
  }

  if (status === 'INACTIVE') {
    return <Badge label={eventStatus.label || 'DND는 휴가중 🏖'} variant="info" />;
  }

  if (applicationEndDateCountdown !== 'END') {
    return <Badge label={`DND는 ${CURRENT_FLAG}기 모집 마감까지 ${applicationEndDateCountdown}`} variant="success" />;
  }

  if (acceptanceCountdown !== 'END') {
    const acceptanceDate = parseEventDateTime(applicantAcceptanceDateTime).locale('ko').format('MM월 DD일 (ddd)');
    return <Badge label={`${acceptanceDate} 모집 발표 📢`} variant="success" />;
  }

  if (status === 'ACTIVE') {
    return <Badge label={eventStatus.label || `DND는 ${CURRENT_FLAG}기 진행중`} variant="success" />;
  }
}

export default EventStatus;
