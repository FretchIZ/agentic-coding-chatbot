const DDG_API = 'https://api.duckduckgo.com';

export async function searchWeb(query: string): Promise<string> {
  try {
    const res = await fetch(`${DDG_API}/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
      headers: { 'User-Agent': 'Kudos.ai/1.0' },
    });
    if (!res.ok) return '';

    const data = await res.json();
    const parts: string[] = [];

    if (data.Answer) parts.push(`Answer: ${data.Answer}`);
    if (data.Abstract) parts.push(data.Abstract);

    const topics = data.RelatedTopics || [];
    for (const t of topics) {
      if (parts.length >= 8) break;
      if (t.Text && t.FirstURL) parts.push(`- ${t.Text} (${t.FirstURL})`);
      else if (t.Topics) for (const sub of t.Topics) {
        if (parts.length >= 8) break;
        if (sub.Text && sub.FirstURL) parts.push(`- ${sub.Text} (${sub.FirstURL})`);
      }
    }

    return parts.join('\n');
  } catch {
    return '';
  }
}
