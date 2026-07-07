import { NextResponse } from 'next/server';
import { searchWeb } from '@/lib/search';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  const results = await searchWeb(query);
  return NextResponse.json({ results: results || 'No search results found.', source: 'DuckDuckGo' });
}
