import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

function extractProperties(page: PageObjectResponse) {
  const props = page.properties;

  const wordProp = props['英'];
  const word =
    wordProp?.type === 'title' ? wordProp.title.map((t) => t.plain_text).join('') : '';

  const meaningProp = props['日'];
  const meaning =
    meaningProp?.type === 'rich_text'
      ? meaningProp.rich_text.map((t) => t.plain_text).join('')
      : '';

  const priorityProp = props['priority'];
  const priority =
    priorityProp?.type === 'select' && priorityProp.select?.name === 'high' ? 'high' : '';

  const tagsProp = props['Multi-select'];
  const tags =
    tagsProp?.type === 'multi_select' ? tagsProp.multi_select.map((t) => t.name) : [];

  const masteredProp = props['Mastered'];
  const mastered = masteredProp?.type === 'checkbox' ? masteredProp.checkbox : false;

  return { word, meaning, priority, tags, mastered };
}

export async function GET() {
  try {
    const allPages: PageObjectResponse[] = [];
    let cursor: string | undefined;

    do {
      const response = await notion.databases.query({
        database_id: DATABASE_ID,
        start_cursor: cursor,
        page_size: 100,
      });

      allPages.push(
        ...response.results.filter(
          (r): r is PageObjectResponse => r.object === 'page' && 'properties' in r
        )
      );

      cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
    } while (cursor);

    const entries = allPages.map(extractProperties).filter((e) => e.word);

    return NextResponse.json(entries);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
