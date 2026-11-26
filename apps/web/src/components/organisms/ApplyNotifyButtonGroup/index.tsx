'use client';

import type { EventStatus } from '@dnd-academy/core';
import type { ButtonProps } from '@dnd-academy/ui';
import { useIsMounted } from '@dnd-academy/ui/client';
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

import { useRecruitment } from '@/components/global/RecruitmentProvider';
import useCountdown from '@/hooks/useCountdown';
import {
  CURRENT_FLAG,
  DESIGNER_APPLICATION_LINK,
  DEVELOPER_APPLICATION_LINK,
  NEXT_COHORT_NOTIFICATION_URL,
  NEXT_FLAG,
} from '@/lib/constants';

import ApplyModal from '../ApplyModal';

type Props = {
  children?: ReactElement<ButtonProps>;
  eventStatus: EventStatus;
};

function ApplyNotifyButtonGroup({ children: child, eventStatus }: Props) {
  const recruitment = useRecruitment();
  const isMounted = useIsMounted();
  const { applicationStartDateTime, applicationEndDateTime } = eventStatus;

  const applicationStartDateCountdown = useCountdown(applicationStartDateTime);
  const applicationEndDateCountdown = useCountdown(applicationEndDateTime);

  const visibleApplyButton = applicationStartDateCountdown === 'END' && applicationEndDateCountdown !== 'END';

  if (!isMounted || recruitment.kind === 'unavailable' || !isValidElement<ButtonProps>(child)) {
    return null;
  }

  const configured = recruitment.kind === 'configured' ? recruitment : undefined;
  const application = configured?.display.application ?? (visibleApplyButton ? 'open' : 'notify');
  if (application === 'hidden') return null;
  if (application === 'notify') {
    const label = (
      <span key="default-label">{`${configured?.display.notificationCohort ?? (applicationStartDateCountdown === 'END' ? NEXT_FLAG : CURRENT_FLAG)}기 알림 신청하기`}</span>
    );
    const children: ReactNode = child.props.children ? (
      <>
        {label}
        {child.props.children}
      </>
    ) : (
      label
    );

    return (
      <>
        {/* NOTE - cloneElement로 알림 신청 링크 속성과 라벨을 주입하는 계약입니다. 변경 시 CTA 이동/표시 상태를 함께 확인해야 합니다. */}
        {cloneElement(
          child,
          {
            ...child.props,
            isExternalLink: true,
            href: configured?.settings.notificationUrl ?? NEXT_COHORT_NOTIFICATION_URL,
          },
          children,
        )}
      </>
    );
  }

  return (
    <ApplyModal
      cohort={configured?.settings.cohort ?? CURRENT_FLAG}
      designerUrl={configured ? configured.settings.designerUrl : DESIGNER_APPLICATION_LINK}
      developerUrl={configured ? configured.settings.developerUrl : DEVELOPER_APPLICATION_LINK}
    >
      {child}
    </ApplyModal>
  );
}

export default ApplyNotifyButtonGroup;
