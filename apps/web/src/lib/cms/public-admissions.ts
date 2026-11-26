import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

import { identity, statuses } from './admissions-contract';
import { blindIndex, decryptIdentity } from './identity';
import { rpc } from './supabase';

const errors = {
  C001: [422, '잘못된 입력값입니다'],
  C004: [503, '서버 오류가 발생했습니다'],
  AP001: [404, '이름과 이메일을 다시 확인해주세요.'],
  AP002: [422, '합격자 조회 가능 기간이 아닙니다'],
  EV001: [404, '이벤트를 찾을 수 없습니다.'],
  RATE: [429, '잠시 후 다시 시도해 주세요.'],
} as const;

function headers(request: Request) {
  const response = new Headers({ 'Cache-Control': 'private, no-store', Vary: 'Origin' });
  const origin = request.headers.get('origin');
  const allowed = (process.env.DND_PASSBOARD_ORIGINS ?? '').split(',').map((value) => value.trim());
  if (origin && allowed.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
    response.set('Access-Control-Allow-Credentials', 'true');
    response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return response;
}

function error(request: Request, code: keyof typeof errors) {
  const [status, message] = errors[code];
  return Response.json({ message, status, errors: [], code }, { status, headers: headers(request) });
}

export function options(request: Request) {
  const result = headers(request);
  return new Response(null, { status: result.has('Access-Control-Allow-Origin') ? 204 : 403, headers: result });
}

export type CurrentEvent = { id: number; name: string; resultAnnouncementDateTime: string; isResultAnnounced: boolean };

export async function currentEvent(request: Request) {
  try {
    const event = await rpc<CurrentEvent | null>('current_admission');
    return event ? Response.json(event, { headers: headers(request) }) : error(request, 'EV001');
  } catch {
    return error(request, 'C004');
  }
}

type CheckResult =
  | { code: 'AP001' | 'AP002' | 'RATE' }
  | { eventName: string; nameCiphertext: string; status: (typeof statuses)[number] };

export async function checkApplicant(request: Request, rawId: string) {
  const eventId = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(eventId)) return error(request, 'C001');
  const stream = request.body?.getReader();
  if (!stream) return error(request, 'C001');
  let raw = '';
  try {
    let bytes = 0;
    const decoder = new TextDecoder('utf-8', { fatal: true });
    for (let part = await stream.read(); !part.done; part = await stream.read()) {
      bytes += part.value.byteLength;
      if (bytes > 4096) {
        await stream.cancel();
        return error(request, 'C001');
      }
      raw += decoder.decode(part.value, { stream: true });
    }
    raw += decoder.decode();
    const parsed = identity.safeParse(JSON.parse(raw));
    if (!parsed.success) return error(request, 'C001');
    const { name, email } = parsed.data;
    const address = clientAddress(request);
    const result = await rpc<CheckResult>('check_admission', {
      event_id: eventId,
      name_hash: blindIndex('name', name),
      email_hash: blindIndex('email', email),
      visitor: blindIndex('visitor', address && isIP(address) ? address : 'unknown'),
    });
    if ('code' in result) return error(request, result.code);
    return Response.json(
      { eventName: result.eventName, name: decryptIdentity('name', result.nameCiphertext), status: result.status },
      { headers: headers(request) },
    );
  } catch (failure) {
    return error(request, failure instanceof SyntaxError ? 'C001' : 'C004');
  }
}

function clientAddress(request: Request) {
  const forwarded = request.headers.get('x-dnd-client') ?? '';
  const signature = request.headers.get('x-dnd-client-signature') ?? '';
  const secret = process.env.DND_ADMISSIONS_PROXY_KEY;
  const [timestamp, ip] = forwarded.split('|');
  if (
    secret &&
    ip &&
    isIP(ip) &&
    Math.abs(Date.now() - Number(timestamp)) <= 30000 &&
    /^[a-f0-9]{64}$/.test(signature)
  ) {
    const expected = createHmac('sha256', secret).update(forwarded).digest();
    if (timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return ip;
  }
  // Vercel replaces this header at the edge. Local traffic shares one limiter bucket.
  return process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() : undefined;
}
