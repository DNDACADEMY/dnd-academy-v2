import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import SignOut from '@/components/auth/SignOut';

async function MainPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <div>AdminPage</div>
      <SignOut />
    </>
  );
}

export default MainPage;
