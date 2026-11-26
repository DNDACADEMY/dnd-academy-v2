import { z } from 'zod';

export const applicationModes = ['auto', 'open', 'notify', 'hidden'] as const;
export const passboardModes = ['auto', 'visible', 'hidden'] as const;
const https = z.url({ protocol: /^https$/ }).max(2048);
const timestamp = z.iso.datetime({ offset: true });

export const recruitmentInput = z
  .object({
    cohortId: z.number().int().positive().safe(),
    applicationMode: z.enum(applicationModes),
    startsAt: timestamp,
    endsAt: timestamp,
    developerUrl: https.nullable(),
    designerUrl: https.nullable(),
    notificationUrl: https,
    passboardMode: z.enum(passboardModes),
  })
  .refine(({ startsAt, endsAt }) => Date.parse(startsAt) < Date.parse(endsAt), { path: ['endsAt'] })
  .refine(
    ({ applicationMode, developerUrl, designerUrl }) =>
      !['auto', 'open'].includes(applicationMode) || Boolean(developerUrl || designerUrl),
    { path: ['developerUrl'] },
  );

export const recruitmentRequest = z.object({
  version: z.number().int().positive().nullable(),
  input: recruitmentInput,
});

export type RecruitmentInput = z.infer<typeof recruitmentInput>;
export type PublicRecruitment = Omit<RecruitmentInput, 'cohortId'> & {
  cohort: number;
  announcement: { startsAt: string; endsAt: string | null; ready: boolean } | null;
};
export type RecruitmentControls = PublicRecruitment & { version: number; cohortId: number };
