import { z } from 'zod';

export const positions = ['FRONTEND', 'BACKEND', 'ANDROID', 'IOS', 'DESIGNER'] as const;
export const statuses = ['NONE', 'PASSED', 'FAILED', 'WAITLISTED'] as const;
export const key = z.number().int().positive().safe();
export const identity = z.object({
  name: z
    .string()
    .max(160)
    .refine((name) => name.trim().length > 0),
  email: z.email().max(254),
});
export const resultRow = identity.extend({ status: z.enum(statuses) });

export const admissionsRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('cohort'), ordinal: key.max(10000) }),
  identity.extend({ action: z.literal('applicant'), cohortId: key, position: z.enum(positions) }),
  z.object({
    action: z.literal('event'),
    id: key,
    cohortId: key,
    name: z.string().trim().min(1).max(160),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }).nullable(),
    current: z.boolean(),
  }),
  z.object({ action: z.literal('ready'), eventId: key }),
  z.object({ action: z.literal('close'), eventId: key }),
  z.object({ action: z.literal('search'), eventId: key, identity }),
  z.object({ action: z.literal('results'), eventId: key, rows: z.array(resultRow).min(1).max(1000) }),
]);

export type AdmissionsState = {
  cohorts: { id: number; ordinal: number }[];
  events: {
    id: number;
    cohort_id: number;
    name: string;
    starts_at: string;
    ends_at: string | null;
    ready: boolean;
    is_current: boolean;
  }[];
  match: { id: number; position: (typeof positions)[number]; status: (typeof statuses)[number] | null } | null;
};

export type ImportRow = {
  location: string;
  outcome: 'new' | 'duplicate' | 'conflict' | 'error';
  reason?: string;
};

type ImportPreview = {
  previewRef: string;
  counts: Record<ImportRow['outcome'], number>;
  rows: ImportRow[];
} & ({ kind: 'cohorts' } | { kind: 'applicants'; cohortId: number });

/** Implementations bind previewRef to the file, importing actor, kind and target.
 * Apply rechecks permissions and validates the same batch within a transaction.
 * Conflict and error batches cannot be applied. Existing results are excluded from this workflow.
 */
export interface ExcelImport {
  previewCohorts(workbook: File): Promise<ImportPreview & { kind: 'cohorts' }>;
  previewApplicants(
    cohortId: number,
    workbook: File,
  ): Promise<ImportPreview & { kind: 'applicants'; cohortId: number }>;
  applyImport(previewRef: string): Promise<{ inserted: number; duplicates: number }>;
}
