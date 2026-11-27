import { z } from 'zod';

import {
  contentInput,
  contentKinds,
  linkKinds,
  maxSkillLabelLength,
  maxSkills,
  organizerPositions,
  reviewPositions,
  safeContentLink,
} from './content-contract';

const id = z.number().int().min(0).max(2147483647);
const positive = z.number().int().positive().safe();
const uuid = z.uuid();
const label = z.string().trim().min(1).max(160);
const deadline = z.iso.datetime({ offset: true });

export const grantRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('teams'), cohortId: positive, count: z.number().int().min(1).max(100) }),
  z.object({ action: z.literal('member'), teamId: uuid, name: label, position: z.enum(reviewPositions) }),
  z.object({ action: z.literal('revoke'), linkId: uuid }),
  z.object({ action: z.literal('extend'), scope: z.enum(['link', 'team']), id: uuid, expiresAt: deadline }),
  z.object({ action: z.literal('extend'), scope: z.literal('cohort'), id: positive, expiresAt: deadline }),
  z.object({
    action: z.literal('issue'),
    kind: z.literal('project'),
    teamId: uuid,
    targetId: id.nullable(),
    label,
    expiresAt: deadline,
  }),
  z.object({
    action: z.literal('issue'),
    kind: z.literal('review'),
    teamId: uuid,
    memberId: uuid,
    targetId: id.nullable(),
    label,
    expiresAt: deadline,
  }),
  z.object({
    action: z.literal('issue'),
    kind: z.literal('organizer'),
    targetId: id.nullable(),
    label,
    expiresAt: deadline,
    position: z.enum(organizerPositions),
    archived: z.boolean(),
  }),
  z.object({ action: z.literal('inspect'), linkId: uuid }),
  z.object({
    action: z.literal('lookup'),
    kind: z.enum(contentKinds),
    query: z.string().trim().max(160),
    cohort: positive.optional(),
  }),
  z.object({ action: z.literal('process'), jobId: uuid }),
  z.object({ action: z.literal('reject'), linkId: uuid }),
  z.object({
    action: z.literal('approve'),
    linkIds: z.array(uuid).min(1).max(101),
    acceptConflicts: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
  }),
]);

export const submissionInput = z.strictObject({
  name: z.string().trim().max(160),
  description: contentInput.shape.description,
  links: z
    .array(
      z
        .object({
          kind: z.enum(linkKinds).exclude(['email']),
          url: z.string().min(1).max(2048),
        })
        .refine(({ kind, url }) => safeContentLink(kind, url), '웹 링크 주소를 확인해 주세요.'),
    )
    .max(50),
  title: z.string().max(300).optional(),
  skills: z.array(z.string().trim().min(1).max(maxSkillLabelLength)).max(maxSkills).optional(),
  thumbnailId: z.uuid().nullable().optional(),
  pdfId: z.uuid().nullable().optional(),
  images: contentInput.shape.images,
});

export const submissionRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('open'), token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }),
  z.object({ action: z.literal('read') }),
  z.object({ action: z.literal('skills') }),
  z.object({ action: z.literal('save'), version: z.number().int().nonnegative(), input: submissionInput }),
  z.object({ action: z.literal('submit'), version: z.number().int().nonnegative(), input: submissionInput }),
]);

export const submissionLabels: Record<(typeof contentKinds)[number], string> = {
  project: '프로젝트',
  review: '후기',
  organizer: '운영진 소개',
};

export type SubmissionLink = {
  id: string;
  kind: (typeof contentKinds)[number];
  label: string;
  teamId: string | null;
  memberId: string | null;
  targetId: number | null;
  expiresAt: string;
  state: 'issued' | 'editing' | 'expired' | 'revoked' | 'submitted' | 'published' | 'rejected';
  version: number;
  savedAt: string | null;
  cohort: number | null;
  teamNumber: number | null;
  publishedId: number | null;
};

export type Submission = SubmissionLink & {
  input: z.infer<typeof submissionInput> & { cohort: number | null; position: string | null; projectId: number | null };
  projectName: string | null;
};

export type SubmissionJob = {
  id: string;
  state: 'queued' | 'processing' | 'failed' | 'published';
  linkIds: string[];
};

export type SubmissionWorkspace = {
  jobs: SubmissionJob[];
  cohortId: number | null;
  cohorts: { id: number; ordinal: number }[];
  teams: {
    id: string;
    number: number;
    projectId: number | null;
    members: { id: string; name: string; position: string }[];
  }[];
  links: SubmissionLink[];
};

const kst = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  dateStyle: 'medium',
  timeStyle: 'short',
  hourCycle: 'h23',
});

export const formatSubmissionTime = (value: string) => kst.format(new Date(value));
export const kstDeadline = (value: string) => (value ? value + (value.length === 16 ? ':00+09:00' : '+09:00') : '');

export function defaultDeadline() {
  return new Date(Date.now() + (3 * 24 + 9) * 60 * 60 * 1000).toISOString().slice(0, 16);
}
