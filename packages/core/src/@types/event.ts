export type EventStatusType = 'UPCOMING' | 'ONGOING' | 'INACTIVE' | 'HOT';

export interface EventStatus {
  status: EventStatusType;
  applicationStartDateTime: string;
  applicationEndDateTime: string;
  applicantAcceptanceDateTime: string;
  label?: string;
}
