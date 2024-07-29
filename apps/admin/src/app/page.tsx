import { redirect } from 'next/navigation';

import { api, type TotalCountStatus } from '@dnd-academy/core';
import { Button, CounterCard } from '@dnd-academy/ui';

import { totalCountStatusAction } from '@/actions/count';
import { auth } from '@/auth';
import SignOut from '@/components/auth/SignOut';

async function MainPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const {
    cumulativeApplicants, dropouts, totalParticipants, totalProjects,
  } = await api<TotalCountStatus>({
    url: '/total_count_status.json',
    method: 'GET',
  });

  return (
    <>
      <h1>DND - AdminPage</h1>
      <SignOut />

      <h2>지원자 수</h2>
      <div>
        <div>
          <CounterCard count={cumulativeApplicants} title="누적 지원자 수" />
          <CounterCard count={totalParticipants} title="총 참가자 수" />
          <CounterCard count={totalProjects} title="총 프로젝트 수" suffix="개" />
          <CounterCard count={dropouts} title="이탈자 수" color="primary" />
        </div>
        <form action={totalCountStatusAction}>
          <input type="number" name="cumulativeApplicants" min={0} placeholder="누적 지원자 수" defaultValue={cumulativeApplicants} required />
          <input type="number" name="totalParticipants" min={0} placeholder="총 참가자 수" defaultValue={totalParticipants} required />
          <input type="number" name="totalProjects" min={0} placeholder="총 프로젝트 수" defaultValue={totalProjects} required />
          <input type="number" name="dropouts" min={0} placeholder="이탈자 수" defaultValue={dropouts} required />
          <Button type="submit">Submit</Button>
        </form>
      </div>
    </>
  );
}

export default MainPage;
