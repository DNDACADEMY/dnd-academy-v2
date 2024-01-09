import clsx from 'clsx';

import TopNavigationBar from '@/components/global/TopNavigationBar';

import { pretendardFont, senFont } from './fonts';

import 'src/styles/global.scss';
import styles from './index.module.scss';

export const metadata = {
  title: 'DND',
  description: 'DND는 개발자와 디자이너라면 누구나 참여할 수 있는 IT비영리단체입니다.',
};

function RootLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={clsx(senFont.variable, pretendardFont.variable)}>
      <body>
        <TopNavigationBar />
        <main className={styles.main}>
          {children}
        </main>
      </body>
    </html>
  );
}

export default RootLayout;
