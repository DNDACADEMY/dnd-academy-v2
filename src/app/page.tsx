import clsx from 'clsx';

import { pretendardFont, senFont } from './fonts';

function Home() {
  return (
    <main>
      <div>한글</div>
      <div>english</div>
      <div className={clsx(pretendardFont.className)}>한글</div>
      <div className={clsx(senFont.className)}>english</div>
    </main>
  );
}

export default Home;
