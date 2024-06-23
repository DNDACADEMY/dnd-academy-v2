import { MetadataRoute } from 'next';

function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DND - 프로젝트에 즐거움을 모두에게 기회를',
    short_name: 'DND',
    description: 'DND는 개발자와 디자이너라면 누구나 참여할 수 있는 IT비영리단체입니다.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}

export default manifest;
