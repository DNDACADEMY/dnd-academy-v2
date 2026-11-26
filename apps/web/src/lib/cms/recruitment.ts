import 'server-only';
import type { RecruitmentControls, RecruitmentInput } from './recruitment-contract';
import { rpc } from './supabase';

export const readRecruitmentControls = () => rpc<RecruitmentControls | null>('recruitment_controls_data');

export function writeRecruitmentControls(actor: string, version: number | null, input: RecruitmentInput) {
  return rpc<RecruitmentControls>('write_recruitment_controls', { actor, expected_version: version, input });
}
