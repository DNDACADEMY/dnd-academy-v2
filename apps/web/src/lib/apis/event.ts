import { CurrentApplicantCount, EventStatus } from '@dnd-academy/core';

import { applicantCountData, eventStatusData } from '../assets/data';

export const getEventStatus = () => eventStatusData as EventStatus;

export const getApplicantCount = () => applicantCountData as CurrentApplicantCount;
