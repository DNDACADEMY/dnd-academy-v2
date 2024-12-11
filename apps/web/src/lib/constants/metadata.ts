const title = 'DND - 프로젝트에 즐거움을 모두에게 기회를';
const description = 'DND는 개발자와 디자이너라면 누구나 참여할 수 있는 IT비영리단체입니다.';
const images = ['/assets/logos/og-thumbnail.png'];
const metadataBase = new URL(process.env.NEXT_PUBLIC_ORIGIN);

export const DEFAULT_METADATA = {
  metadataBase,
  title,
  description,
  openGraph: {
    title,
    description,
    url: process.env.NEXT_PUBLIC_ORIGIN,
    images,
  },
  twitter: {
    description,
    title,
    images,
  },
};

const METADATA = {
  images,
  metadataBase,
  title,
  description,
};

export default METADATA;
