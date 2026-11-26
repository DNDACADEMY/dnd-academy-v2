'use client';

import { EventStatus } from '@dnd-academy/core';
import { Button } from '@dnd-academy/ui';
import { useIsMounted } from '@dnd-academy/ui/client';

import { useRecruitment } from '@/components/global/RecruitmentProvider';
import useCountdown from '@/hooks/useCountdown';
import sendGA4Event from '@/lib/apis/analytics';
import { CURRENT_FLAG, PASSBOARD_URL } from '@/lib/constants';
import { GA_EVENT } from '@/lib/constants/gaEvent';

type PassboardButtonProps = {
  eventStatus: EventStatus;
};

export default function PassboardButton({ eventStatus }: PassboardButtonProps) {
  const recruitment = useRecruitment();
  const { applicantAcceptanceDateTime, status } = eventStatus;
  const isMounted = useIsMounted();
  const acceptanceCountdown = useCountdown(applicantAcceptanceDateTime);

  const cohort = recruitment.kind === 'configured' ? recruitment.settings.cohort : CURRENT_FLAG;
  const visible =
    recruitment.kind === 'configured'
      ? recruitment.display.passboard
      : recruitment.kind === 'legacy' && status !== 'INACTIVE' && acceptanceCountdown === 'END';
  const label =
    recruitment.kind === 'configured' && !recruitment.settings.announcement ? '합격자 조회' : `${cohort}기 합격자 조회`;
  const handleClick = () => {
    sendGA4Event(GA_EVENT.PASS_BOARD_CLICK, {
      currentFlag: cohort,
    });
  };

  if (!isMounted || !visible) {
    return null;
  }

  return (
    <Button onClick={handleClick} isExternalLink size="xLarge" buttonType="default" href={PASSBOARD_URL}>
      {label}
    </Button>
  );
}
