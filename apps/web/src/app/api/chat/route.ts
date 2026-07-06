import { NextResponse } from 'next/server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { createProvider } from '@codeagent/ai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { content: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in env.' },
        { status: 200 }
      );
    }

    const anthropic = createAnthropic({ apiKey });
    const stream = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      maxTokens: 4096,
      temperature: 0.7,
    });

    return stream.toTextStreamResponse();
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json({ content: `Error: ${err.message}` }, { status: 500 });
  }
}
