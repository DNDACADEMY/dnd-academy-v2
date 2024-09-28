import '@dnd-academy/ui/style.css';
import 'src/styles/global.scss';

import { GoogleAnalytics } from '@next/third-parties/google';

import ClientProviders from '@/components/global/ClientProviders';
import Footer from '@/components/global/Footer';
import Toast from '@/components/global/Toast';
import TopNavigationBar from '@/components/global/TopNavigationBar';
import { DEFAULT_METADATA } from '@/lib/constants/metadata';

import { pretendardFont } from './_fonts';

import styles from './index.module.scss';

export const metadata = DEFAULT_METADATA;

function RootLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={pretendardFont.variable}>
      <head>
        <link rel="mask-icon" href="/assets/safari-pinned-tab.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
      </head>
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
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
    </html>
  );
}

export default RootLayout;
