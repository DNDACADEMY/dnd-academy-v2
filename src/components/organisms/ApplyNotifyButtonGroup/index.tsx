'use client';

import { cloneElement, ReactElement } from 'react';

import { ButtonProps } from '@/components/atoms/Button';
import useCountdown from '@/hooks/useCountdown';
import { CURRENT_FLAG, NEXT_FLAG } from '@/lib/constants';
import { EventStatus } from '@/lib/types/event';

import ApplyModal from '../ApplyModal';

type Props = {
  children: ReactElement<ButtonProps>;
  eventStatus: EventStatus;
};

function ApplyNotifyButtonGroup({ children: child, eventStatus }: Props) {
  const {
    applicationStartDateTime, applicationEndDateTime,
  } = eventStatus;

  const applicationStartDateCountdown = useCountdown(applicationStartDateTime);
  const applicationEndDateCountdown = useCountdown(applicationEndDateTime);

  const visibleApplyButton = applicationStartDateCountdown === 'END' && applicationEndDateCountdown !== 'END';

  if (!visibleApplyButton) {
    return (
      <>
        {cloneElement(child, {
          ...child.props,
          isExternalLink: true,
          href: 'https://forms.gle/nA3MLWbUyAoikWw16',
        }, [
          <span key="default-label">{`${applicationStartDateCountdown !== 'END' ? CURRENT_FLAG : NEXT_FLAG}기 알림 신청하기`}</span>,
          child.props.children,
        ])}
      </>
    );
  }

  return (
    <ApplyModal>
      {child}
    </ApplyModal>
  );
}

export default ApplyNotifyButtonGroup;
