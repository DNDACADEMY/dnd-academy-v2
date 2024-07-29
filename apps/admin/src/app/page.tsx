import { redirect } from 'next/navigation';

import { api, CurrentApplicantCount } from '@dnd-academy/core';

import { auth } from '@/auth';
import SignOut from '@/components/auth/SignOut';

async function MainPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const currentApplicantCountData = await api<CurrentApplicantCount>({
    url: '/current_applicant_count.json',
    method: 'GET',
  });

  console.log('currentApplicantCountData', currentApplicantCountData);

  return (
    <>
      <h1>DND - AdminPage</h1>
      <div>{currentApplicantCountData.designer}</div>
      <div>{currentApplicantCountData.developer}</div>
      <SignOut />
    </>
  );
}

export default MainPage;
