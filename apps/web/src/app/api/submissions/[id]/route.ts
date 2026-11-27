import { cookies } from 'next/headers';
import { z } from 'zod';

import { contentSkills } from '@/lib/cms/content';
import { submissionRequest } from '@/lib/cms/submission-contract';
import {
  readSubmission,
  submissionCookie,
  submissionError,
  submissionHeaders,
  submissionsEnabled,
  tokenHash,
} from '@/lib/cms/submissions';
import { rpc } from '@/lib/cms/supabase';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!submissionsEnabled()) return new Response(null, { status: 404, headers: submissionHeaders });
  const origin = request.headers.get('origin');
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site' ||
    !request.headers.get('content-type')?.startsWith('application/json')
  ) {
    return Response.json({ message: '요청 형식을 확인해 주세요.' }, { status: 403, headers: submissionHeaders });
  }
  const id = z.uuid().safeParse((await context.params).id);
  const parsed = submissionRequest.safeParse(await request.json().catch(() => null));
  if (!id.success || !parsed.success) {
    return Response.json({ message: '입력값을 확인해 주세요.' }, { status: 422, headers: submissionHeaders });
  }
  const sessionName = submissionCookie(id.data);
  const jar = await cookies();
  const input = parsed.data;
  try {
    if (input.action === 'open') {
      const current = await readSubmission(id.data, tokenHash(input.token));
      jar.set(sessionName, input.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/submissions/' + id.data,
        maxAge: 2 * 60 * 60,
      });
      return Response.json(current, { headers: submissionHeaders });
    }
    const token = jar.get(sessionName)?.value;
    if (!token)
      return Response.json(
        { message: '원래 받은 링크로 다시 열어 주세요.' },
        { status: 401, headers: submissionHeaders },
      );
    const credential = tokenHash(token);
    if (input.action === 'read') {
      return Response.json(await readSubmission(id.data, credential), { headers: submissionHeaders });
    }
    if (input.action === 'skills') {
      await readSubmission(id.data, credential);
      return Response.json({ skills: await contentSkills() }, { headers: submissionHeaders });
    }
    const result = await rpc('save_submission', {
      selected_link: id.data,
      credential,
      expected_version: input.version,
      input: input.input,
      submit: input.action === 'submit',
    });
    if (input.action === 'submit') jar.set(sessionName, '', { path: '/api/submissions/' + id.data, maxAge: 0 });
    return Response.json(result, { headers: submissionHeaders });
  } catch (error) {
    return submissionError(error);
  }
}
