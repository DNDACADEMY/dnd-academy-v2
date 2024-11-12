// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function getNotionData() {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        // property: 'Status',
        // status: {
        //   equals: 'Published'
        // }
      },
    });

    const pages = response.results.map((page: any) => ({
      id: page.id,
      title: page.properties.Title?.title[0]?.plain_text || '',
      tags: page.properties.Tags?.multi_select.map((tag: any) => tag.name) || [],
      date: page.properties.Date?.date?.start || '',
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const fs = require('fs');
    fs.writeFileSync(
      'notion-data.json',
      JSON.stringify(pages, null, 2),
      'utf-8',
    );

    return pages;
  } catch (error) {
    console.error('Error fetching Notion data:', error);
    throw error;
  }
}

getNotionData()
  .then(() => console.log('Data successfully fetched and saved'))
  .catch((error) => console.error('Failed to fetch data:', error));
