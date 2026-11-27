import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

import { rpc } from './supabase';

function clientNetwork(requestHeaders: Headers) {
  if (!process.env.VERCEL) return null;
  const ip = requestHeaders.get('x-vercel-forwarded-for')?.trim() ?? '';
  const version = isIP(ip);
  if (version === 4) return ip;
  if (version !== 6 || ip.includes('%')) return null;

  const normalized = new URL(`http://[${ip}]`).hostname.slice(1, -1);
  const mappedV4 = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(normalized);
  if (mappedV4) {
    const [high, low] = mappedV4.slice(1).map((word) => Number.parseInt(word, 16));
    return [high >> 8, high & 255, low >> 8, low & 255].join('.');
  }
  const [leading, trailing] = normalized.split('::');
  const start = leading ? leading.split(':') : [];
  const end = trailing ? trailing.split(':') : [];
  return [...start, ...Array(8 - start.length - end.length).fill('0'), ...end].slice(0, 4).join(':') + '::/64';
}

export function reserveAdminLogin(email: string, requestHeaders: Headers) {
  const secret = process.env.DND_SUPABASE_SERVICE_KEY;
  if (!secret) throw new Error('Admin login rate limiter is unavailable');

  const digest = (scope: string, value: string) =>
    createHmac('sha256', secret).update('admin-login\0').update(scope).update('\0').update(value).digest('hex');
  const account = email.toLowerCase();
  const network = clientNetwork(requestHeaders);
  return rpc<boolean>('reserve_admin_login', {
    network_digest: network && digest('network', network),
    pair_digest: network && digest('network_account', `${network}\0${account}`),
    account_digest: digest('account', account),
  });
}
