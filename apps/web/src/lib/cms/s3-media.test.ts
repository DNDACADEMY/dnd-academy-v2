import { s3PublicMedia, s3UploadUrl } from './s3-media';

vi.mock('@vercel/oidc-aws-credentials-provider', () => ({
  awsCredentialsProvider: () => async () => ({
    accessKeyId: 'AKIDEXAMPLE',
    secretAccessKey: 'example-signing-key-for-local-tests',
  }),
}));

const draft = 's3/cms/drafts/15e45a86-5904-49e4-bbb5-d6088a21fd27.pdf';
const published =
  's3/cms/published/attempt-44ad8ddb-916e-47e0-8b1e-865e98fabe77/15e45a86-5904-49e4-bbb5-d6088a21fd27.pdf';

beforeEach(() => {
  vi.stubEnv('DND_CMS_S3_BUCKET', 'example-cms-preview');
  vi.stubEnv('DND_CMS_S3_REGION', 'ap-northeast-2');
  vi.stubEnv('DND_CMS_AWS_ROLE_ARN', 'arn:aws:iam::123456789012:role/example');
  vi.stubEnv('DND_CMS_MEDIA_CDN_ORIGIN', 'https://example.cloudfront.net');
});

afterEach(() => vi.unstubAllEnvs());

it('signs a short-lived upload for one key, exact size, MIME, no-store and no overwrite', async () => {
  const ticket = await s3UploadUrl(draft, 'application/pdf', 1234);
  const url = new URL(ticket.url);
  expect(url.hostname).toBe('example-cms-preview.s3.ap-northeast-2.amazonaws.com');
  expect(url.pathname).toBe(`/${draft}`);
  expect(url.searchParams.get('X-Amz-Expires')).toBe('600');
  expect(url.searchParams.get('X-Amz-SignedHeaders')?.split(';')).toEqual(
    expect.arrayContaining(['cache-control', 'content-length', 'content-type', 'if-none-match']),
  );
  expect(ticket.headers).toEqual({
    'Cache-Control': 'private, no-store',
    'Content-Type': 'application/pdf',
    'If-None-Match': '*',
  });
});

it('resolves only published keys through the CDN', () => {
  expect(s3PublicMedia(published)).toBe(`https://example.cloudfront.net/${published}`);
  expect(() => s3PublicMedia(draft)).toThrow('Database request failed');
  expect(() => s3PublicMedia('s3/cms/published/../../drafts/a.pdf')).toThrow('Database request failed');
});
