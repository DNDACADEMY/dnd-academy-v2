import { z } from 'zod';

export const contentKinds = ['project', 'organizer', 'review'] as const;
export type ContentKind = (typeof contentKinds)[number];
export const organizerPositions = ['개발', '디자인', '마케팅', '운영', '마스코트'] as const;
export const reviewPositions = [
  '백엔드 개발자',
  '프론트엔드 개발자',
  '프로덕트 디자이너',
  'Android Developer',
  'iOS Developer',
] as const;
export const detailKinds = ['now', 'previous', 'role', 'recommendation', 'interests', 'share'] as const;
export const linkKinds = [
  'github',
  'googlePlayStore',
  'youtube',
  'link',
  'figma',
  'appStore',
  'behance',
  'linkedin',
  'facebook',
  'email',
  'velog',
  'tistory',
  'medium',
  'instagram',
  'naverBlog',
  'brunch',
] as const;

const legacy = z
  .url()
  .refine((value) => new URL(value).origin === 'https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com')
  .nullable()
  .optional();
const asset = z.uuid().nullable().optional();
const id = z.number().int().min(0).max(2147483647);
const cohort = z.number().int().positive().max(10000);

export const contentInput = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(50000),
  links: z.array(z.object({ kind: z.enum(linkKinds), url: z.string().min(1).max(2048) })).max(50),
  title: z.string().max(300).optional(),
  cohort: cohort.nullable().optional(),
  thumbnailId: asset,
  pdfId: asset,
  legacyThumbnail: legacy,
  legacyPdf: legacy,
  images: z
    .array(z.object({ mediaId: asset, legacyUrl: legacy }).refine((value) => value.mediaId || value.legacyUrl))
    .max(50)
    .optional(),
  skills: z.array(z.string().trim().min(1).max(160)).max(100).optional(),
  author: z.string().max(160).optional(),
  position: z.string().max(40).optional(),
  mbti: z.string().max(30).optional(),
  emoji: z.string().max(30).nullable().optional(),
  isArchived: z.boolean().optional(),
  details: z
    .array(z.object({ kind: z.enum(detailKinds), body: z.string().max(10000) }))
    .max(100)
    .optional(),
  projectId: id.nullable().optional(),
  originalProjectName: z.string().max(160).optional(),
});

export type ContentInput = z.infer<typeof contentInput>;
export type ContentRecord = ContentInput & {
  id: number;
  revisionId: number;
  editNumber: number;
  state?: 'draft' | 'published' | 'archived';
  liveRevisionId?: number | null;
  liveEditNumber?: number | null;
};
export const contentRequest = z.object({
  kind: z.enum(contentKinds),
  id: id.nullable(),
  revisionId: z.number().int().positive().safe().nullable(),
  editNumber: z.number().int().positive().nullable(),
  action: z.enum(['save', 'publish', 'unpublish']),
  input: contentInput.optional(),
});

export const mediaMax = 200 * 1024 * 1024;
export const mediaMimes = ['image/webp', 'application/pdf'] as const;
export const mediaRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('upload'), mime: z.enum(mediaMimes), bytes: z.number().int().positive().max(mediaMax) }),
  z.object({ action: z.literal('verify'), key: z.uuid() }),
  z.object({ action: z.literal('preview'), id: z.uuid() }),
]);

export function validContent(kind: ContentKind, input: ContentInput) {
  switch (kind) {
    case 'project':
      return input.cohort && input.title?.trim() && input.images && input.skills;
    case 'organizer':
      return (
        input.author !== undefined &&
        input.mbti !== undefined &&
        input.isArchived !== undefined &&
        organizerPositions.some((value) => value === input.position) &&
        input.details &&
        input.skills
      );
    case 'review':
      return reviewPositions.some((value) => value === input.position) && input.description.trim();
  }
}

export function safeContentLink(kind: ContentInput['links'][number]['kind'], link: string) {
  try {
    const url = new URL(link);
    return url.protocol === 'https:' || url.protocol === 'http:' || (kind === 'email' && url.protocol === 'mailto:');
  } catch {
    return false;
  }
}
