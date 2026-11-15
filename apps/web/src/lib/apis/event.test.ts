import { eventStatusData } from '../assets/data';
import { getEventStatus } from './event';

vi.mock('../assets/data', () => ({
  eventStatusData: {
    status: 'UPCOMING',
    applicationStartDateTime: '2026/11/16 00:00:00',
    applicationEndDateTime: '2026/12/07 00:00:00',
    applicantAcceptanceDateTime: '2026/12/19 00:00:00',
  },
}));

afterEach(() => vi.unstubAllEnvs());

it.each([
  ['preview', 'develop', '2026/11/15 17:00:00'],
  ['production', 'main', '2026/11/16 00:00:00'],
  ['production', 'develop', '2026/11/16 00:00:00'],
  ['preview', 'feature/example', '2026/11/16 00:00:00'],
  [undefined, undefined, '2026/11/16 00:00:00'],
])('%s 환경의 %s 브랜치에서 모집 시작 시각을 선택한다', (environment, branch, start) => {
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', environment);
  vi.stubEnv('NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF', branch);

  expect(getEventStatus()).toEqual({ ...eventStatusData, applicationStartDateTime: start });
});
