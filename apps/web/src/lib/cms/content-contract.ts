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
  'blog',
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

export const linkLabels: Record<(typeof linkKinds)[number], string> = {
  github: 'GitHub',
  googlePlayStore: 'Google Play',
  youtube: 'YouTube',
  link: '웹사이트',
  blog: '개인 블로그',
  figma: 'Figma',
  appStore: 'App Store',
  behance: 'Behance',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  email: '이메일',
  velog: 'Velog',
  tistory: '티스토리',
  medium: 'Medium',
  instagram: 'Instagram',
  naverBlog: '네이버 블로그',
  brunch: '브런치',
};

const legacy = z
  .url()
  .refine((value) => new URL(value).origin === 'https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com')
  .nullable()
  .optional();
const asset = z.uuid().nullable().optional();
const id = z.number().int().min(0).max(2147483647);
const cohort = z.number().int().positive().max(10000);

export const maxSkills = 100;
export const maxSkillLabelLength = 160;

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
  skills: z.array(z.string().trim().min(1).max(maxSkillLabelLength)).max(maxSkills).optional(),
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
export type ContentSummary = Pick<
  ContentRecord,
  'id' | 'name' | 'cohort' | 'position' | 'author' | 'state' | 'liveRevisionId'
> & { isArchived?: boolean | null };

const requiredDraftFields = {
  name: true,
  description: true,
  links: true,
} as const;

const saveProject = contentInput
  .pick({
    ...requiredDraftFields,
    thumbnailId: true,
    pdfId: true,
    legacyThumbnail: true,
    legacyPdf: true,
    title: true,
    cohort: true,
    images: true,
    skills: true,
  })
  .extend({
    title: z
      .string()
      .max(300)
      .refine((title) => Boolean(title.trim())),
    cohort,
    images: contentInput.shape.images.unwrap(),
    skills: contentInput.shape.skills.unwrap(),
  });

const saveOrganizer = contentInput
  .pick({
    ...requiredDraftFields,
    thumbnailId: true,
    legacyThumbnail: true,
    author: true,
    position: true,
    mbti: true,
    emoji: true,
    isArchived: true,
    details: true,
    skills: true,
  })
  .extend({
    position: z.enum(organizerPositions),
    author: contentInput.shape.author.unwrap(),
    mbti: contentInput.shape.mbti.unwrap(),
    details: contentInput.shape.details.unwrap(),
    skills: contentInput.shape.skills.unwrap(),
    isArchived: z.boolean(),
  });

const saveReview = contentInput
  .pick({
    ...requiredDraftFields,
    position: true,
    cohort: true,
    projectId: true,
    originalProjectName: true,
  })
  .extend({
    position: z.enum(reviewPositions),
    description: contentInput.shape.description.refine((text) => Boolean(text.trim())),
  });

const changeTarget = z.object({
  id: id.nullable(),
  revisionId: z.number().int().positive().safe().nullable(),
  editNumber: z.number().int().positive().nullable(),
});

export const contentRequest = z.discriminatedUnion('action', [
  z.discriminatedUnion('kind', [
    changeTarget.extend({ action: z.literal('save'), kind: z.literal('project'), input: saveProject }),
    changeTarget.extend({ action: z.literal('save'), kind: z.literal('organizer'), input: saveOrganizer }),
    changeTarget.extend({ action: z.literal('save'), kind: z.literal('review'), input: saveReview }),
  ]),
  changeTarget.extend({ action: z.literal('publish'), kind: z.enum(contentKinds) }),
  changeTarget.extend({ action: z.literal('unpublish'), kind: z.enum(contentKinds) }),
  z.object({
    action: z.literal('delete'),
    kind: z.literal('organizer'),
    id,
    revisionId: z.number().int().positive().safe(),
    editNumber: z.number().int().positive(),
  }),
]);

export const contentPreviewRequest = z.object({
  mediaIds: z.array(z.uuid()).max(52),
  projectId: id.nullable(),
});

export const mediaMax = 200 * 1024 * 1024;
export const mediaMimes = ['image/webp', 'application/pdf'] as const;
export type MediaItem = {
  id: string;
  mime: (typeof mediaMimes)[number];
  name: string | null;
  bytes: number;
  url: string;
};
export type MediaLibrary = { items: MediaItem[]; hasMore: boolean };

export const mediaRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('upload'), mime: z.enum(mediaMimes), bytes: z.number().int().positive().max(mediaMax) }),
  z.object({ action: z.literal('resume'), key: z.uuid() }),
  z.object({ action: z.literal('verify'), key: z.uuid(), name: z.string().trim().min(1).max(255).optional() }),
  z.object({
    action: z.literal('library'),
    mime: z.enum(mediaMimes),
    page: z.number().int().min(0).max(10_000),
    query: z.string().trim().max(160),
  }),
  z.object({ action: z.literal('preview'), id: z.uuid() }),
]);

export function safeContentLink(kind: ContentInput['links'][number]['kind'], link: string) {
  try {
    const url = new URL(link);
    return url.protocol === 'https:' || url.protocol === 'http:' || (kind === 'email' && url.protocol === 'mailto:');
  } catch {
    return false;
  }
}
