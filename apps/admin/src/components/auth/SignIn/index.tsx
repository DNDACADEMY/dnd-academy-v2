import { Button } from '@dnd-academy/ui/client';

import { signIn } from '@/auth';

function SignIn() {
  return (
    <form
      action={async () => {
        'use server';

        await signIn('google', { redirectTo: '/' });
      }}
    >
      <Button type="submit">로그인</Button>
    </form>
  );
}

export default SignIn;
