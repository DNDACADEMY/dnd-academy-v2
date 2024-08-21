import { put } from '@vercel/blob';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// eslint-disable-next-line import/prefer-default-export
export const updateCurrentApplicantCount = async () => {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const developerApplicantDoc = new GoogleSpreadsheet('1LLxVCTkqtTZoMftrEkYOlwVdyEwoEKwCg7WvXwfW2Rk', serviceAccountAuth);
  const designerApplicantDoc = new GoogleSpreadsheet('1BToiD3gjzT-SKWeKnQMRuFvGXmYv44oEigSIJy_w1Jc', serviceAccountAuth);

  await developerApplicantDoc.loadInfo();
  await designerApplicantDoc.loadInfo();

  const developerApplicantRows = await developerApplicantDoc.sheetsByIndex[0].getRows();
  const designerApplicantRows = await designerApplicantDoc.sheetsByIndex[0].getRows();

  const currentApplicantCountForm = {
    developer: developerApplicantRows.length,
    designer: designerApplicantRows.length,
  };

  const jsonString = JSON.stringify(currentApplicantCountForm);

  const requestBlob = new Blob([jsonString], { type: 'application/json' });

  await put('current_applicant_count.json', requestBlob, {
    access: 'public',
    token: process.env.DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    cacheControlMaxAge: 3600,
  });

  return currentApplicantCountForm;
};
