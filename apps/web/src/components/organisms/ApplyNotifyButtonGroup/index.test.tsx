import type { EventStatus } from '@dnd-academy/core';
import { Button } from '@dnd-academy/ui';
import { act, fireEvent, render, screen } from '@testing-library/react';

import EventStatusBadge from '@/components/organisms/EventStatus';
import PassboardButton from '@/components/organisms/PassboardButton';
import {
  CURRENT_FLAG,
  DESIGNER_APPLICATION_LINK,
  DEVELOPER_APPLICATION_LINK,
  NEXT_COHORT_NOTIFICATION_URL,
  PASSBOARD_URL,
} from '@/lib/constants';

import ApplyNotifyButtonGroup from '.';

const eventStatus: EventStatus = {
  status: 'UPCOMING',
  applicationStartDateTime: '2026/11/16 00:00:00',
  applicationEndDateTime: '2026/12/07 00:00:00',
  applicantAcceptanceDateTime: '2026/12/19 00:00:00',
};

function renderAt(time: string) {
  vi.setSystemTime(new Date(time));
  render(
    <>
      <div id="portal-container" />
      <ApplyNotifyButtonGroup eventStatus={eventStatus}>
        <Button />
      </ApplyNotifyButtonGroup>
      <EventStatusBadge eventStatus={eventStatus} />
      <PassboardButton eventStatus={eventStatus} />
    </>,
  );
}

describe('한국 시각 기준 모집 일정', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('접수 시작 시각에 알림 버튼이 두 직군의 지원서를 여는 버튼으로 바뀐다', () => {
    renderAt('2026-11-15T23:59:59+09:00');
    expect(screen.getByRole('link', { name: `${CURRENT_FLAG}기 알림 신청하기` })).toHaveAttribute(
      'href',
      NEXT_COHORT_NOTIFICATION_URL,
    );

    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole('button', { name: `${CURRENT_FLAG}기 지원하기` }));
    expect(screen.getByRole('link', { name: '개발자' })).toHaveAttribute('href', DEVELOPER_APPLICATION_LINK);
    expect(screen.getByRole('link', { name: '디자이너' })).toHaveAttribute('href', DESIGNER_APPLICATION_LINK);
  });

  it('마감일 마지막 초까지 접수하고 자정에 다음 기수 알림으로 바뀐다', () => {
    renderAt('2026-12-06T23:59:59+09:00');
    expect(screen.getByRole('button', { name: `${CURRENT_FLAG}기 지원하기` })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('link', { name: `${CURRENT_FLAG + 1}기 알림 신청하기` })).toHaveAttribute(
      'href',
      NEXT_COHORT_NOTIFICATION_URL,
    );
    expect(screen.getByText('12월 19일 (토) 모집 발표 📢')).toBeInTheDocument();
  });

  it('발표 시각이 되면 새로고침 없이 합격자 조회 링크가 나타난다', () => {
    renderAt('2026-12-18T23:59:59+09:00');
    const link = { name: `${CURRENT_FLAG}기 합격자 조회` };
    expect(screen.queryByRole('link', link)).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('link', link)).toHaveAttribute('href', PASSBOARD_URL);
    expect(screen.queryByText('12월 19일 (토) 모집 발표 📢')).not.toBeInTheDocument();
  });
});
