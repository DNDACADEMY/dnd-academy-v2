import { contentRequest } from './content-contract';

const target = { action: 'save', id: null, revisionId: null, editNumber: null };
const basic = { name: 'CMS 테스트', description: '본문', links: [] };

it('requires project-only fields when saving a project', () => {
  const project = {
    ...target,
    kind: 'project',
    input: { ...basic, title: '제목', cohort: 16, images: [], skills: [] },
  };
  expect(contentRequest.safeParse(project).success).toBe(true);
  expect(contentRequest.safeParse({ ...project, input: { ...project.input, cohort: null } }).success).toBe(false);
  expect(contentRequest.safeParse({ ...project, input: { ...project.input, title: '   ' } }).success).toBe(false);
});

it('keeps project ID zero and strips fields belonging to other content kinds', () => {
  const result = contentRequest.parse({
    ...target,
    kind: 'review',
    input: { ...basic, position: '백엔드 개발자', projectId: 0, skills: ['TS'] },
  });
  expect(result).toMatchObject({ input: { projectId: 0 } });
  expect(result).not.toHaveProperty('input.skills');
});

it('requires an organizer publication flag and accepts false', () => {
  const input = { ...basic, author: '', mbti: '', position: '개발', details: [], skills: [] };
  expect(contentRequest.safeParse({ ...target, kind: 'organizer', input }).success).toBe(false);
  expect(
    contentRequest.safeParse({ ...target, kind: 'organizer', input: { ...input, isArchived: false } }).success,
  ).toBe(true);
});
