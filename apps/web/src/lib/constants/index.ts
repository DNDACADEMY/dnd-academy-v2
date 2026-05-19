import { EventStatusType } from '@dnd-academy/core';

import { eventStatusData } from '../assets/data';

const { status } = eventStatusData as { status: EventStatusType };

export const CURRENT_FLAG = 15;

// NOTE: UPCOMING은 현재 기수이므로 0, 나머지는 다음기수로 1씩 증가
export const NEXT_FLAG = CURRENT_FLAG + (status === 'UPCOMING' ? 0 : 1);

export const DEVELOPER_APPLICATION_LINK = 'https://forms.gle/XWCQkdCRfw8pNam97';

export const DESIGNER_APPLICATION_LINK = 'https://forms.gle/drzbsk1TDunck8Xu6';

export const NEXT_COHORT_NOTIFICATION_URL = 'https://forms.gle/nA3MLWbUyAoikWw16';

export const PASSBOARD_URL = 'https://passboard.dnd.ac';
