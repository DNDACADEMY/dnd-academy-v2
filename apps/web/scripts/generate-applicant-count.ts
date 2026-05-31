import * as fs from 'fs';
import * as path from 'path';

import { loadEnvConfig } from '@next/env';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

const ensureNumber = (value?: number | null): number => {
  if (typeof value === 'number') {
    return value;
  }

  return 0;
};

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const PROJECT_ROOT = path.resolve(__dirname, '../..');

async function generateApplicantCount() {
  try {
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const developerApplicantDoc = new GoogleSpreadsheet(
      '1jMd6qWebY_Hz8NBxbWTIPqjyFmZCWf4HGlNkmFpWwP0',
      serviceAccountAuth,
    );
    const designerApplicantDoc = new GoogleSpreadsheet(
      '12cwmV0Gf38xOQukIy-IQqfGTHigujTaVdctd7gnbiIw',
      serviceAccountAuth,
    );

    await developerApplicantDoc.loadInfo();
    await designerApplicantDoc.loadInfo();

    const developerApplicantRows = await developerApplicantDoc.sheetsByIndex[0].getRows();
    const designerApplicantRows = await designerApplicantDoc.sheetsByIndex[0].getRows();

    const developerApplicantCount = ensureNumber(developerApplicantRows?.length);
    const designerApplicantCount = ensureNumber(designerApplicantRows?.length);

    const applicantData = {
      developer: developerApplicantCount,
      designer: designerApplicantCount,
      total: developerApplicantCount + designerApplicantCount,
      lastUpdated: new Date().toISOString(),
    };

    const outputPath = path.join(PROJECT_ROOT, 'src/lib/assets/data/applicant-count.json');

    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(applicantData, null, 2));

    console.log('✅ 지원자 수 데이터가 성공적으로 생성되었습니다.');
    console.log(`📁 파일 위치: ${outputPath}`);
    console.log('📊 현재 지원자 현황:');
    console.log(`- 개발자: ${applicantData.developer}명`);
    console.log(`- 디자이너: ${applicantData.designer}명`);
    console.log(`- 총 지원자: ${applicantData.total}명`);
  } catch (error) {
    console.error('❌ 데이터 생성 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

generateApplicantCount();
