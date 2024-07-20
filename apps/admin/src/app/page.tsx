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
      <h1>DND - AdminPage</h1>
      <SignOut />
    </>
  );
}

export default MainPage;
