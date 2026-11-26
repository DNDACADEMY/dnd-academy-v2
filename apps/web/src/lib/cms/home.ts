import 'server-only';
import { getProjects } from '@/lib/apis/project';

import type { HomeInput, HomeWorkspace } from './home-contract';
import { mediaAssets, previewMedia, publicMedia } from './media';
import { rpc } from './supabase';

export const publishedHome = () => rpc<HomeInput | null>('published_home');
export const editableHome = (actor: string) => rpc<HomeWorkspace | null>('editable_home', { actor });
export const homeLogoIds = (input: HomeInput) => input.sponsors.flatMap(({ mediaId }) => (mediaId ? [mediaId] : []));

export async function homePresentation(input: HomeInput, preview = false) {
  const ids = input.sponsors.flatMap(({ visible, mediaId }) => (visible && mediaId ? [mediaId] : []));
  const [items, logoEntries] = await Promise.all([
    getProjects(),
    preview
      ? previewMedia(ids).then((items) => items.map(({ id, url }) => [id, url] as const))
      : mediaAssets(ids).then((assets) =>
          [...assets].flatMap(([id, asset]) =>
            asset.bucket === 'cms-public' && asset.ready ? [[id, publicMedia(asset.object_key)] as const] : [],
          ),
        ),
  ]);
  const logos = new Map(logoEntries);
  const eligible = items.filter(({ thumbnail }) => thumbnail);
  const byId = new Map(eligible.map((project) => [project.id, project]));
  const projects = input.automaticProjects
    ? eligible.slice(0, 20)
    : input.projectIds.flatMap((id) => byId.get(id) ?? []);
  return {
    stats: input.stats,
    faqs: input.faqs.filter(({ visible }) => visible),
    sponsors: input.sponsors.flatMap(({ name, url, logoPath, mediaId, visible }) => {
      const logo = logoPath ?? (mediaId ? logos.get(mediaId) : undefined);
      return visible && logo ? [{ name, url, logo }] : [];
    }),
    sponsorInfo: input.sponsorInfo,
    projects,
  };
}

export type HomePresentation = Awaited<ReturnType<typeof homePresentation>>;
