import 'server-only';
import { cache } from 'react';

import type { ContentInput, ContentKind, ContentRecord } from './content-contract';
import { mediaAssets, publicMedia } from './media';
import { rpc } from './supabase';

export function contentAssets(row: ContentInput) {
  return [row.thumbnailId, row.pdfId, ...(row.images ?? []).map((image) => image.mediaId)].filter((id): id is string =>
    Boolean(id),
  );
}

export const publishedContent = cache(async (kind: ContentKind, id?: number) => {
  const rows = await rpc<ContentRecord[]>('published_content', { kind, selected_id: id ?? null });
  const ids = [...new Set(rows.flatMap(contentAssets))];
  const media = new Map<string, string>();
  for (let start = 0; start < ids.length; start += 80) {
    const assets = await mediaAssets(ids.slice(start, start + 80));
    for (const [id, asset] of assets) {
      if (asset.bucket === 'cms-public' && asset.ready) media.set(id, publicMedia(asset.object_key));
    }
  }
  return { rows, media };
});
