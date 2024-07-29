'use server';

import { put } from '@vercel/blob';

// eslint-disable-next-line import/prefer-default-export
export const totalCountStatusAction = async (formData: FormData) => {
  const requestForm = {
    cumulativeApplicants: formData.get('cumulativeApplicants'),
    dropouts: formData.get('dropouts'),
    totalParticipants: formData.get('totalParticipants'),
    totalProjects: formData.get('totalProjects'),
  };

  const jsonString = JSON.stringify(requestForm);

  const requestBlob = new Blob([jsonString], { type: 'application/json' });

  const blob = await put('total_count_status.json', requestBlob, {
    access: 'public',
    token: process.env.DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });

  console.log(blob);
};
