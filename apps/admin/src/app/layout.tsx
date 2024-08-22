import { pretendardFont } from '@/app/_fonts';
import ClientProvider from '@/components/common/ClientLayout';

import '@dnd-academy/ui/style.css';
import 'src/styles/global.scss';
import styles from './index.module.scss';

function RootLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={pretendardFont.variable}>
      <body>
        <main className={styles.main}>
          <ClientProvider>
            {children}
          </ClientProvider>
        </main>
      </body>
    </html>
  );
}

export default RootLayout;
