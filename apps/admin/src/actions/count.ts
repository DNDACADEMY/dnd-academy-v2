'use server';

import { revalidatePath } from 'next/cache';

import { put } from '@vercel/blob';

type TotalCountStatusStateType = {
  message: string;
  messageType?: 'error' | 'success';
};

// eslint-disable-next-line import/prefer-default-export
export async function totalCountStatusAction(
  _: TotalCountStatusStateType | null,
  formData: FormData,
): Promise<TotalCountStatusStateType> {
  try {
    const requestForm = {
      cumulativeApplicants: formData.get('cumulativeApplicants'),
      dropouts: formData.get('dropouts'),
      totalParticipants: formData.get('totalParticipants'),
      totalProjects: formData.get('totalProjects'),
    };

    const jsonString = JSON.stringify(requestForm);

    const requestBlob = new Blob([jsonString], { type: 'application/json' });

    await put('total_count_status.json', requestBlob, {
      access: 'public',
      token: process.env.DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    });

    revalidatePath('/total-count-status');

    return {
      message: '수정사항이 반영되었습니다. 캐시 적용으로 실제 적용까지는 최대 5분정도 소요됩니다.',
      messageType: 'success',
    };
  } catch (error) {
    return {
      message: '수정사항이 반영되지 않았습니다. 잠시 후 다시 시도해주세요.',
      messageType: 'error',
    };
  }
}
