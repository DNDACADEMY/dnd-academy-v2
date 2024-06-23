import ClientProviders from '@/components/global/ClientProviders';
import Footer from '@/components/global/Footer';
import Toast from '@/components/global/Toast';
import TopNavigationBar from '@/components/global/TopNavigationBar';
import { DEFAULT_METADATA } from '@/lib/constants/metadata';

import { pretendardFont } from './_fonts';

import 'src/styles/global.scss';
import styles from './index.module.scss';

export const metadata = DEFAULT_METADATA;

function RootLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={pretendardFont.className}>
      <body>
        <ClientProviders>
          <TopNavigationBar />
          <main className={styles.main}>
            {children}
          </main>
          <Footer />
          <div id="portal-container" />
        </ClientProviders>
        <Toast />
      </body>
    </html>
  );
}

export default RootLayout;
