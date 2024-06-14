import HomePage from '@/components/pages/HomePage';

type ParamsKey = 'tab';

type Props = {
  searchParams: Record<ParamsKey, string | undefined>;
};

function Home({ searchParams }: Props) {
  return (
    <HomePage tab={searchParams.tab} />
  );
}

export default Home;
