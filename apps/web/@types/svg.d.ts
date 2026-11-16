declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

  export default content;
}

declare module '*.svg?url' {
  import type { StaticImageData } from 'next/image';

  const image: StaticImageData;
  export default image;
}
