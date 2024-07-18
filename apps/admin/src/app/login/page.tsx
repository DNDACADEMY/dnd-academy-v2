import SignIn from '@/components/auth/SignIn';

type Props = {
  searchParams: { [key: string]: string | undefined; };
};

async function LoginPage({ searchParams }: Props) {
  return (
    <>
      <div>login</div>
      {searchParams?.error === 'unauthorized_email' && (
        <div>
          접근이 불가능한 이메일 입니다.
        </div>
      )}
      <SignIn />
    </>
  );
}

export default LoginPage;
