export type EventStatusType = 'UPCOMING' | 'ONGOING' | 'ACTIVE' | 'INACTIVE' | 'HOT';

export interface EventStatus {
  status: EventStatusType;
  applicationStartDateTime: string;
  applicationEndDateTime: string;
  applicantAcceptanceDateTime: string;
  label?: string;
}
