import { getProject } from '@/lib/apis/project';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.VERCEL_ENV !== 'preview') return new Response(null, { status: 404 });

  const { id } = await params;
  const pdf = (await getProject({ id: /^(0|[1-9]\d*)$/.test(id) ? Number(id) : NaN }))?.pdf;
  if (!pdf) return new Response(null, { status: 404 });

  const range = request.headers.get('range');
  return fetch(pdf, { method: request.method, headers: range ? { Range: range } : {}, cache: 'no-store' });
}
