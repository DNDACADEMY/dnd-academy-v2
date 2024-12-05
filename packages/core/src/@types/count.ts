export interface CurrentApplicantCount {
  developer: number;
  designer: number;
  total: number;
  lastUpdated: string;
}

export interface TotalCountStatus {
  cumulativeApplicants: number;
  totalParticipants: number;
  totalProjects: number;
  dropouts: number;
}
