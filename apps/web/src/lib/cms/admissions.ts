import { z } from 'zod';

import { admissionsRequest, type AdmissionsState } from './admissions-contract';
import { blindIndex, encryptIdentity } from './identity';
import { rpc } from './supabase';

function hashes({ name, email }: { name: string; email: string }) {
  return { nameHash: blindIndex('name', name), emailHash: blindIndex('email', email) };
}

export function readAdmissions(actor: string, eventId?: number, identity?: { name: string; email: string }) {
  const indexed = identity && hashes(identity);
  return rpc<AdmissionsState>('admissions_read', {
    actor,
    selected_event: eventId ?? null,
    name_hash: indexed?.nameHash ?? null,
    email_hash: indexed?.emailHash ?? null,
  });
}

export async function writeAdmissions(actor: string, request: z.infer<typeof admissionsRequest>) {
  const { action } = request;
  if (action === 'search') return readAdmissions(actor, request.eventId, request.identity);
  let input: Record<string, unknown> = request;
  if (action === 'applicant') {
    input = {
      cohortId: request.cohortId,
      position: request.position,
      ...hashes(request),
      nameCiphertext: encryptIdentity('name', request.name),
      emailCiphertext: encryptIdentity('email', request.email),
    };
  }
  if (action === 'results') {
    const rows = request.rows.map((row) => ({ ...hashes(row), status: row.status }));
    if (new Set(rows.map((row) => row.nameHash + row.emailHash)).size !== rows.length) {
      return { outcome: 'conflict' };
    }
    input = { eventId: request.eventId, rows };
  }
  return rpc<{ outcome: string; changed?: number }>('admissions_write', { actor, operation: action, input });
}
