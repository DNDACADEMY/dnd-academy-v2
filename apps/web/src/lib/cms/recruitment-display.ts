import type { PublicRecruitment } from './recruitment-contract';

export function recruitmentDisplay(settings: PublicRecruitment, now: number) {
  const started = now >= Date.parse(settings.startsAt);
  const ended = now >= Date.parse(settings.endsAt);
  const { announcement } = settings;
  const canApply = settings.applicationMode === 'open' || (settings.applicationMode === 'auto' && started && !ended);
  const application = settings.applicationMode === 'hidden' ? 'hidden' : canApply ? 'open' : 'notify';
  const passboard =
    settings.passboardMode === 'visible' ||
    (settings.passboardMode === 'auto' &&
      Boolean(
        announcement?.ready &&
        now >= Date.parse(announcement.startsAt) &&
        (!announcement.endsAt || now < Date.parse(announcement.endsAt)),
      ));
  return {
    application,
    passboard,
    applicationUpcoming: !started,
    announcementUpcoming: Boolean(announcement && now < Date.parse(announcement.startsAt)),
    notificationCohort: ended ? settings.cohort + 1 : settings.cohort,
  } as const;
}
