'use client';

import { EventStatus } from '@dnd-academy/core';
import { Button } from '@dnd-academy/ui';
import dayjs from 'dayjs';

import sendGA4Event from '@/lib/apis/analytics';
import { CURRENT_FLAG, PASSBOARD_URL } from '@/lib/constants';
import { GA_EVENT } from '@/lib/constants/gaEvent';

type PassboardButtonProps = {
  eventStatus: EventStatus;
};

export default function PassboardButton({ eventStatus }: PassboardButtonProps) {
  const { applicantAcceptanceDateTime, status } = eventStatus;

  const handleClick = () => {
    sendGA4Event(GA_EVENT.PASS_BOARD_CLICK, {
      currentFlag: CURRENT_FLAG,
    });
  };

  const isBeforeAcceptance = dayjs().isBefore(dayjs(applicantAcceptanceDateTime));

  if (status === 'INACTIVE' || isBeforeAcceptance) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      isExternalLink
      size="xLarge"
      buttonType="default"
      href={PASSBOARD_URL}
    >
      {`${CURRENT_FLAG}기 합격자 조회`}
    </Button>
  );
}
