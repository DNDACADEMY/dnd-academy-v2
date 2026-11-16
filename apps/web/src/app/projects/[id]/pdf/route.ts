import { getProject } from '@/lib/apis/project';

export async function GET(request: Request, { params }: RouteContext<'/projects/[id]/pdf'>) {
  if (process.env.VERCEL_ENV !== 'preview') return new Response(null, { status: 404 });

  const { id } = await params;
  const pdf = getProject({ id: Number(id) })?.pdf;
  if (!pdf) return new Response(null, { status: 404 });

  const range = request.headers.get('range');
  return fetch(pdf, { method: request.method, headers: range ? { Range: range } : {}, cache: 'no-store' });
}
