import { Metadata } from 'next';

import AboutPage from '@/components/pages/AboutPage';
import METADATA from '@/lib/constants/metadata';
import { PUBLIC_ORIGIN } from '@/lib/constants/origin';

const title = '소개 - DND';

export const metadata: Metadata = {
  metadataBase: METADATA.metadataBase,
  title,
  openGraph: {
    title,
    url: `${PUBLIC_ORIGIN}/dnd/about`,
    images: METADATA.images,
  },
  twitter: {
    title,
    images: METADATA.images,
  },
};

function Page() {
  return (
    <AboutPage />
  );
}

export default Page;
