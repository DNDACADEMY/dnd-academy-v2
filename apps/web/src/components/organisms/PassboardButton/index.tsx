'use client';

import { EventStatusType } from '@dnd-academy/core';
import { Button } from '@dnd-academy/ui';

import sendGA4Event from '@/lib/apis/analytics';
import { CURRENT_FLAG, PASSBOARD_URL } from '@/lib/constants';
import { GA_EVENT } from '@/lib/constants/gaEvent';

type PassboardButtonProps = {
  status: EventStatusType;
};

export default function PassboardButton({ status }: PassboardButtonProps) {
  const handleClick = () => {
    sendGA4Event(GA_EVENT.PASS_BOARD_CLICK, {
      currentFlag: CURRENT_FLAG,
    });
  };

  if (status === 'INACTIVE') {
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
