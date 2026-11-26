import type { PublicRecruitment } from './recruitment-contract';
import { recruitmentDisplay } from './recruitment-display';

const settings: PublicRecruitment = {
  cohort: 16,
  applicationMode: 'auto',
  startsAt: '2026-11-16T00:00:00+09:00',
  endsAt: '2026-12-07T00:00:00+09:00',
  designerUrl: 'https://example.com/design',
  developerUrl: 'https://example.com/development',
  notificationUrl: 'https://example.com/notify',
  passboardMode: 'auto',
  announcement: { startsAt: '2026-12-19T00:00:00+09:00', endsAt: '2026-12-20T00:00:00+09:00', ready: true },
};
const at = (settings: PublicRecruitment, date: string) => recruitmentDisplay(settings, Date.parse(date));

it('uses the exact Korean-time boundaries for both buttons', () => {
  expect(at(settings, '2026-11-15T23:59:59+09:00').application).toBe('notify');
  expect(at(settings, '2026-11-16T00:00:00+09:00').application).toBe('open');
  expect(at(settings, '2026-12-07T00:00:00+09:00')).toMatchObject({ application: 'notify', notificationCohort: 17 });
  expect(at(settings, '2026-12-18T23:59:59+09:00').passboard).toBe(false);
  expect(at(settings, '2026-12-19T00:00:00+09:00').passboard).toBe(true);
  expect(at(settings, '2026-12-20T00:00:00+09:00').passboard).toBe(false);
});

it('requires an active, ready event for automatic Passboard visibility', () => {
  expect(at({ ...settings, announcement: null }, '2026-12-19T00:00:00+09:00').passboard).toBe(false);
  expect(
    at({ ...settings, announcement: { ...settings.announcement!, ready: false } }, '2026-12-19T00:00:00+09:00')
      .passboard,
  ).toBe(false);
});

it('applies the two manual controls independently', () => {
  expect(
    at({ ...settings, applicationMode: 'hidden', passboardMode: 'visible' }, '2026-11-17T00:00:00+09:00'),
  ).toMatchObject({ application: 'hidden', passboard: true });
  expect(
    at({ ...settings, applicationMode: 'open', passboardMode: 'hidden' }, '2026-12-19T00:00:00+09:00'),
  ).toMatchObject({ application: 'open', passboard: false });
});
