import { Metadata } from 'next';

import CulturePage from '@/components/pages/CulturePage';
import METADATA from '@/lib/constants/metadata';

const title = '문화 - DND';

export const metadata: Metadata = {
  metadataBase: METADATA.metadataBase,
  title,
  openGraph: {
    title,
    url: `${process.env.NEXT_PUBLIC_ORIGIN}/dnd/culture`,
    images: METADATA.images,
  },
  twitter: {
    title,
    images: METADATA.images,
  },
};

function Page() {
  return (
    <CulturePage />
  );
}

export default Page;
