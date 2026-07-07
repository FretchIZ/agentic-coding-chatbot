import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DDG_API = 'https://api.duckduckgo.com';

interface DDGResult {
  Abstract?: string;
  AbstractSource?: string;
  AbstractURL?: string;
  Answer?: string;
  RelatedTopics?: { Text?: string; FirstURL?: string; Topics?: any[] }[];
  Results?: { Text?: string; FirstURL?: string }[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  try {
    const res = await fetch(`${DDG_API}/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
      headers: { 'User-Agent': 'Kudos.ai/1.0' },
    });
    if (!res.ok) return NextResponse.json({ error: 'Search failed' }, { status: 502 });

    const data: DDGResult = await res.json();
    const results: string[] = [];

    if (data.Answer) results.push(`Answer: ${data.Answer}`);
    if (data.Abstract) results.push(`${data.Abstract}${data.AbstractSource ? ` (Source: ${data.AbstractSource})` : ''}`);

    const topics = data.RelatedTopics || [];
    const snippetLimit = 6;
    let count = 0;

    for (const t of topics) {
      if (count >= snippetLimit) break;
      if (t.Text && t.FirstURL) {
        results.push(`- ${t.Text} (${t.FirstURL})`);
        count++;
      } else if (t.Topics) {
        for (const sub of t.Topics) {
          if (count >= snippetLimit) break;
          if (sub.Text && sub.FirstURL) {
            results.push(`- ${sub.Text} (${sub.FirstURL})`);
            count++;
          }
        }
      }
    }

    if (results.length === 0) results.push('No search results found.');

    return NextResponse.json({ results: results.join('\n'), source: 'DuckDuckGo' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
