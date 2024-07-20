import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import SignOut from '@/components/auth/SignOut';

async function MainPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // TODO - 제거 예정 (임시 호출 테스트)
  const response = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_BLOB_HOST}/current_applicant_count.json`, {
    method: 'GET',
  });

  const currentApplicantCountData = await response.json();

  console.log('currentApplicantCountData', currentApplicantCountData);

  return (
    <>
      <h1>DND - AdminPage</h1>
      <SignOut />
    </>
  );
}

export default MainPage;
