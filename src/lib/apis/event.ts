import { eventStatusData } from '../assets/data';
import { EventStatus } from '../types/event';

// eslint-disable-next-line import/prefer-default-export
export const getEventStatus = () => eventStatusData as EventStatus;
