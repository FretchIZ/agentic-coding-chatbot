import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FREE_API = 'https://image.pollinations.ai/prompt';

export async function POST(req: Request) {
  try {
    const { prompt, width = 1024, height = 1024, model } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const encoded = encodeURIComponent(prompt.slice(0, 500));
    const params = new URLSearchParams({ width: String(width), height: String(height) });
    if (model) params.set('model', model);

    const imageUrl = `${FREE_API}/${encoded}?${params}`;

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Image API error: ${imgRes.status}`);

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const base64 = buffer.toString('base64');
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

    return NextResponse.json({
      url: imageUrl,
      dataUri: `data:${contentType};base64,${base64}`,
      prompt,
      width,
      height,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
