import 'server-only';
import { createHash, randomUUID } from 'node:crypto';

import { contentAssets } from './content';
import { type ContentInput, type ContentRecord, contentRequest, detailKinds } from './content-contract';
import { mediaAssets, previewMedia, publishWithMedia } from './media';
import {
  type OrganizerProfileInput,
  type Submission,
  type SubmissionJob,
  organizerProfileDetails,
  organizerProfileFields,
  organizerProfileFrom,
} from './submission-contract';
import { DatabaseError, rpc } from './supabase';

type ReviewRow = {
  submission: Submission;
  base: ContentRecord | null;
  current: ContentRecord | null;
  editor: ContentRecord | null;
  archived: boolean | null;
};

const fields = {
  project: ['name', 'title', 'description', 'links', 'skills', 'thumbnailId', 'pdfId', 'images'],
  organizer: ['name', 'description', 'links', 'skills', 'thumbnailId'],
  review: ['name', 'description', 'links'],
} as const satisfies Record<Submission['kind'], readonly (keyof ContentInput)[]>;

const editableValue = (
  input: ContentRecord | Submission['input'] | null,
  field: (typeof fields)[Submission['kind']][number],
) => {
  if (field === 'links') return (input?.links ?? []).filter(({ kind }) => kind !== 'email');
  if (field === 'images' || field === 'skills') return input?.[field] ?? [];
  if (field === 'thumbnailId' || field === 'pdfId') return input?.[field] ?? null;
  return input?.[field] ?? '';
};

const equal = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

async function readReview(actor: string, ids: string[]) {
  return rpc<ReviewRow[]>('admin_submission_review', { actor, link_ids: ids });
}

export async function inspectSubmission(actor: string, id: string) {
  const [row] = await readReview(actor, [id]);
  const { submission } = row;
  const { item } = prepare(row);
  const draft = { ...item.input, links: item.input.links.filter(({ kind }) => kind !== 'email') };
  return {
    submission,
    draft,
    media: await previewMedia(contentAssets(draft)),
    changes: [
      ...fields[submission.kind].flatMap((field) => {
        const before = editableValue(row.current, field);
        const after = editableValue(submission.input, field);
        return equal(before, after) ? [] : [{ field, before, after }];
      }),
      ...(submission.kind === 'organizer'
        ? organizerEdits(row).flatMap(({ field, live, requested, changed }) =>
            changed && !equal(live, requested) ? [{ field, before: live, after: requested }] : [],
          )
        : []),
    ],
  };
}

function organizerEdits({ submission, base, current, editor }: ReviewRow) {
  const submitted = submission.input.organizerProfile;
  const before = organizerProfileFrom(base);
  const published = organizerProfileFrom(current);
  const draft = editor?.state === 'draft' ? organizerProfileFrom(editor) : null;
  return organizerProfileFields.map((field) => {
    const requested = submitted?.[field] ?? before[field];
    const live = published[field];
    const savedDraft = draft?.[field] ?? live;
    const changed = !equal(before[field], requested);
    return {
      field,
      live,
      requested,
      changed,
      conflict:
        changed &&
        ((!equal(before[field], live) && !equal(requested, live)) ||
          (!equal(live, savedDraft) && !equal(requested, savedDraft))),
    };
  });
}

function prepare(row: ReviewRow) {
  const { submission, base, current, editor } = row;
  if (submission.targetId !== null && !current) throw new DatabaseError('40001');
  const kind = submission.kind;
  const draft = editor?.state === 'draft' ? editor : null;
  const conflicts: string[] = [];
  const initial = current ?? base;
  const payload: ContentInput = {
    ...initial,
    name: initial?.name ?? submission.input.name,
    description: initial?.description ?? submission.input.description,
    links: [],
    ...(kind === 'project'
      ? {
          title: initial?.title ?? submission.input.title,
          cohort: submission.cohort,
          images: initial?.images ?? [],
          skills: initial?.skills ?? [],
        }
      : {}),
    ...(kind === 'organizer'
      ? {
          position: initial?.position ?? submission.input.position ?? undefined,
          isArchived: initial?.isArchived ?? row.archived ?? false,
          author: initial?.author ?? '',
          mbti: initial?.mbti ?? '',
          details: initial?.details ?? [],
          skills: initial?.skills ?? [],
        }
      : {}),
    ...(kind === 'review'
      ? {
          position: initial?.position ?? submission.input.position ?? undefined,
          cohort: submission.cohort,
          projectId: submission.input.projectId,
        }
      : {}),
  };
  for (const field of fields[kind]) {
    const before = editableValue(base, field);
    const requested = editableValue(submission.input, field);
    const liveValue = editableValue(current, field);
    const draftValue = editableValue(draft, field);
    const changed = base === null || !equal(before, requested);
    if (
      changed &&
      base &&
      ((!equal(before, liveValue) && !equal(requested, liveValue)) ||
        (draft && !equal(liveValue, draftValue) && !equal(requested, draftValue)))
    )
      conflicts.push(field);
    Object.assign(payload, { [field]: changed ? requested : liveValue });
  }
  if (kind === 'organizer') {
    const edits = organizerEdits(row).filter(({ changed }) => changed);
    const profile: OrganizerProfileInput = organizerProfileFrom(initial);
    for (const { field, requested, conflict } of edits) {
      if (conflict) conflicts.push(field);
      Object.assign(profile, { [field]: requested });
    }
    payload.mbti = profile.mbti;
    const editedDetails = new Set(edits.filter(({ field }) => field !== 'mbti').map(({ field }) => field));
    if (editedDetails.size > 0) {
      payload.details = [
        ...(initial?.details ?? []).filter(({ kind: detail }) => detail === 'share' || !editedDetails.has(detail)),
        ...organizerProfileDetails(profile).filter(
          ({ kind: detail }) => detail !== 'share' && editedDetails.has(detail),
        ),
      ];
    }
  }
  if (kind !== 'review') {
    payload.links.push(...(initial?.links ?? []).filter(({ kind }) => kind === 'email'));
  }
  if (payload.thumbnailId) {
    payload.legacyThumbnail = null;
    if (
      kind === 'organizer' &&
      payload.thumbnailId !== base?.thumbnailId &&
      payload.thumbnailId === submission.input.thumbnailId
    ) {
      payload.emoji = null;
    }
  }
  if (payload.pdfId) payload.legacyPdf = null;

  const publicationInput = contentRequest.safeParse({
    kind,
    action: 'save',
    id: submission.targetId,
    revisionId: editor?.revisionId ?? null,
    editNumber: editor?.editNumber ?? null,
    input: payload,
  });
  if (!publicationInput.success || publicationInput.data.action !== 'save') throw new DatabaseError('22023');
  const input = publicationInput.data.input;
  const restoreDraft = draft
    ? Object.fromEntries(
        Object.entries(input).map(([key, value]) => [
          key,
          !equal(draft[key as keyof ContentInput], current?.[key as keyof ContentInput])
            ? draft[key as keyof ContentInput]
            : value,
        ]),
      )
    : null;
  if (kind === 'organizer' && draft && restoreDraft) {
    restoreDraft.details = detailKinds.flatMap((kind) => {
      const publishedDetails = (current?.details ?? []).filter((entry) => entry.kind === kind);
      const draftDetails = (draft.details ?? []).filter((entry) => entry.kind === kind);
      return equal(publishedDetails, draftDetails)
        ? (payload.details ?? []).filter((entry) => entry.kind === kind)
        : draftDetails;
    });
  }
  return {
    conflicts,
    item: {
      kind,
      linkId: submission.id,
      expectedLive: current?.revisionId ?? null,
      expectedRevision: editor?.revisionId ?? null,
      expectedEdit: editor?.editNumber ?? null,
      input,
      restoreDraft,
    },
  };
}

async function prepareApproval(actor: string, ids: string[]) {
  const rows = await readReview(actor, ids);
  const team = rows[0]?.submission.teamId;
  if (rows.some(({ submission }) => submission.teamId !== team) || (!team && rows.length !== 1))
    throw new DatabaseError('22023');
  const prepared = rows.map(prepare);
  const items = prepared.map(({ item }) => item);
  const conflicts = prepared.flatMap(({ item, conflicts }) => conflicts.map((field) => ({ id: item.linkId, field })));
  const confirmation = createHash('sha256')
    .update(JSON.stringify(items.map(({ restoreDraft: _draft, ...item }) => item)))
    .digest('hex');
  return { items, conflicts, confirmation };
}

export async function approveSubmissions(actor: string, ids: string[], accepted?: string) {
  const { conflicts, confirmation } = await prepareApproval(actor, ids);
  if (conflicts.length && confirmation !== accepted) return { conflicts, confirmation };
  if (accepted && accepted !== confirmation) throw new DatabaseError('40001');
  const jobId = await rpc<string>('queue_submission_publication', { actor, link_ids: ids, fingerprint: confirmation });
  return { jobId };
}

type ClaimedJob = {
  id: string;
  actor: string;
  state: 'processing';
  fingerprint: string;
  linkIds: string[];
  assets: Record<string, string>;
};

export async function processSubmissionPublication(jobId: string | null) {
  const worker = randomUUID();
  const job = await rpc<ClaimedJob | Pick<SubmissionJob, 'state'> | null>('claim_submission_publication', {
    selected_job: jobId,
    worker,
  });
  if (!job || !('id' in job)) return job;
  const advance = (input: Record<string, unknown>) =>
    rpc<{ id: number; kind: Submission['kind'] }[] | null>('advance_submission_publication', {
      selected_job: job.id,
      worker,
      ...input,
    });
  try {
    const { items, confirmation } = await prepareApproval(job.actor, job.linkIds);
    if (confirmation !== job.fingerprint) throw new DatabaseError('40001');
    const ids = [...new Set(items.flatMap(({ input }) => contentAssets(input)))].filter((id) => !job.assets[id]);
    const assets = await mediaAssets(ids);
    const stagingId = ids.find((id) => assets.get(id)?.bucket !== 'cms-public');
    if (stagingId) {
      await publishWithMedia([stagingId], (copies) =>
        advance({
          source_asset: stagingId,
          public_asset: copies[stagingId],
        }),
      );
      return { state: 'queued' as const };
    }
    const published = await advance({ items });
    return { state: 'published' as const, published };
  } catch (error) {
    if (
      !(error instanceof DatabaseError) ||
      !['22023', '23503', '23505', '23514', '40001', '42501', 'MEDIA_INVALID'].includes(error.code)
    ) {
      throw error;
    }
    await advance({ failure: true });
    return { state: 'failed' as const };
  }
}
