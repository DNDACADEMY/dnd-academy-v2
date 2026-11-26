import { z } from 'zod';

const httpUrl = z
  .url({ protocol: /^https?$/ })
  .max(2048)
  .nullable();
const count = z.number().int().min(0).max(2147483647);
const stats = z.object({
  cumulativeApplicants: count,
  totalParticipants: count,
  totalProjects: count,
  dropouts: count,
  dropoutCohort: z.number().int().min(1).max(10000),
  asOf: z.iso.date().nullable(),
});

export const homeInput = z.object({
  stats,
  sponsorInfo: z.object({ description: z.string().trim().min(1).max(2000), contactUrl: httpUrl }),
  automaticProjects: z.boolean(),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(300),
        answer: z.string().trim().min(1).max(8000),
        visible: z.boolean(),
      }),
    )
    .max(100),
  sponsors: z
    .array(
      z
        .object({
          name: z.string().trim().min(1).max(160),
          url: httpUrl,
          logoPath: z
            .string()
            .regex(/^\/assets\/logos\/sponsors\/[a-z0-9-]+[.]png$/)
            .nullable(),
          mediaId: z.uuid().nullable(),
          visible: z.boolean(),
        })
        .refine(({ logoPath, mediaId }) => Boolean(logoPath) !== Boolean(mediaId)),
    )
    .max(100),
  projectIds: z
    .array(count)
    .max(20)
    .refine((ids) => new Set(ids).size === ids.length),
});

export const homeRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save'), revisionId: z.number().int().positive().safe(), input: homeInput }),
  z.object({ action: z.literal('publish'), revisionId: z.number().int().positive().safe() }),
]);

export type HomeInput = z.infer<typeof homeInput>;
export type HomeStats = HomeInput['stats'];
export type HomeWorkspace = { revisionId: number; publishedId: number; input: HomeInput };
