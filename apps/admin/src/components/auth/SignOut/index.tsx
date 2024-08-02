import { Button } from '@dnd-academy/ui';

import { signOut } from '@/auth';

function SignOut() {
  return (
    <form
      action={async () => {
        'use server';

        await signOut();
      }}
    >
      <Button type="submit">로그아웃</Button>
    </form>
  );
}

export default SignOut;
