// Verify the published PNGs against git, upload lossless WebP copies, and emit SQL to link verified copies.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const sharp = createRequire(new URL('../apps/web/package.json', import.meta.url))('sharp');
const deploy = process.argv.includes('--sql');
const base = process.env.DND_SUPABASE_URL;
const key = process.env.DND_SUPABASE_SERVICE_KEY;
const origin = 'https://dnd.ac';
const logos = /"logoPath": "(\/assets\/logos\/sponsors\/[a-z0-9-]+[.]png)"/g;
const seed = await readFile(new URL('../supabase/seeds/home-cms.sql', import.meta.url), 'utf8');
const sources = [...seed.matchAll(logos)].map(([, path]) => path);
if (!sources.length || (deploy && (!base || !key))) throw new Error('Missing logo sources or Storage configuration');

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function pixels(input) {
  return sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function fetchFile(url) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`File request failed (${response.status})`);
  return { bytes: Buffer.from(await response.arrayBuffer()), mime: response.headers.get('content-type') };
}

const rows = await Promise.all(
  sources.map(async (path) => {
    const local = await readFile(new URL(`../apps/web/public${path}`, import.meta.url));
    const remote = await fetchFile(origin + path);
    if (!local.equals(remote.bytes) || !remote.mime?.startsWith('image/png'))
      throw new Error(`PNG mismatch for ${path}`);
    const webp = await sharp(local).webp({ lossless: true }).toBuffer();
    const [before, after] = await Promise.all([pixels(local), pixels(webp)]);
    if (before.info.width !== after.info.width || before.info.height !== after.info.height)
      throw new Error(`Size changed: ${path}`);
    for (let offset = 0; offset < before.data.length; offset += 4) {
      const alpha = before.data[offset + 3];
      if (
        alpha !== after.data[offset + 3] ||
        (alpha > 0 && !before.data.subarray(offset, offset + 3).equals(after.data.subarray(offset, offset + 3)))
      ) {
        throw new Error(`Visible pixels changed: ${path}`);
      }
    }
    const sourceHash = hash(local);
    const outputHash = hash(webp);
    const destination = `home/logos/${outputHash}.webp`;
    if (deploy) {
      const storage = new URL('/storage/v1/object/', base).href;
      const sent = await fetch(`${storage}cms-public/${destination}`, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/webp', 'x-upsert': 'false' },
        body: webp,
      });
      if (!sent.ok && sent.status !== 409) {
        const error = await sent.json().catch(() => null);
        if (error?.error !== 'Duplicate')
          throw new Error(`Storage upload failed (${sent.status}, ${error?.error ?? 'unknown error'})`);
      }
      const publicFile = await fetchFile(`${storage}public/cms-public/${destination}`);
      if (!publicFile.mime?.startsWith('image/webp') || !publicFile.bytes.equals(webp)) {
        throw new Error(`Storage bytes differ for ${path}`);
      }
    }
    return { path, sourceHash, outputHash, destination, bytes: webp.length };
  }),
);

if (!deploy) {
  console.log(JSON.stringify({ source: origin, verifiedLosslessLogos: rows.length }));
} else {
  console.log('begin;\ndo $logos$ declare asset uuid; begin');
  for (const { path, sourceHash, outputHash, destination, bytes } of rows) {
    const filename = path
      .split('/')
      .at(-1)
      .replace(/[.]png$/, '.webp');
    console.log(`  insert into public.media_assets(bucket, object_key, mime, bytes, sha256, display_name)
  values ('cms-public', '${destination}', 'image/webp', ${bytes}, '${outputHash}', '${filename}')
  on conflict (bucket, object_key) do nothing;
  select id into strict asset from public.media_assets where bucket='cms-public' and object_key='${destination}'
    and mime='image/webp' and bytes=${bytes} and sha256='${outputHash}' and ready;
  insert into public.cms_legacy_media(source_object_key, source_sha256, conversion, asset_id)
    values ('dnd.ac${path}', '${sourceHash}', 'webp-lossless', asset)
    on conflict (source_object_key) do nothing;
  perform 1 from public.cms_legacy_media where source_object_key='dnd.ac${path}'
    and source_sha256='${sourceHash}' and asset_id=asset;
  if not found then raise exception 'Sponsor logo mapping conflicts with a previous import'; end if;
  update public.home_sponsors set media_id=asset, logo_path=null where logo_path='${path}';`);
  }
  console.log('end $logos$;\ncommit;');
}
