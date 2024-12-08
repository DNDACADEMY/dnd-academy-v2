import SignIn from '@/components/auth/SignIn';

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined; }>;
};

async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <>
      <div>login</div>
      {params?.error === 'unauthorized_email' && (
        <div>
          접근이 불가능한 이메일 입니다.
        </div>
      )}
      <SignIn />
    </>
  );
}

export default LoginPage;
