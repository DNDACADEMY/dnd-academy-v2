import { MetadataRoute } from 'next';

function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DND - 프로젝트에 즐거움을 모두에게 기회를',
    short_name: 'DND',
    description: 'DND는 개발자와 디자이너라면 누구나 참여할 수 있는 IT비영리단체입니다.',
    start_url: '/',
    display: 'standalone',
    background_color: '#13161c',
    theme_color: '#13161c',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/assets/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/assets/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/assets/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

export default manifest;
