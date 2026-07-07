import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TEST_MODE = !process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY === 'test';

export async function POST(req: Request) {
  try {
    const { messages, tools } = await req.json();

    if (TEST_MODE) {
      return NextResponse.json({
        content: mockResponse(messages),
      });
    }

    const { createMistral } = await import('@ai-sdk/mistral');
    const { streamText, tool } = await import('ai');
    const { z } = await import('zod');

    const mistral = createMistral({
      apiKey: process.env.MISTRAL_API_KEY,
    });

    const aiTools: Record<string, any> = {};
    if (tools) {
      for (const t of tools) {
        aiTools[t.name] = tool({
          description: t.description,
          parameters: z.object({
            task: z.string().describe(t.description),
            context: z.string().optional().describe('Additional context'),
          }),
        });
      }
    }

    const result = streamText({
      model: mistral('mistral-large-latest'),
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      tools: Object.keys(aiTools).length > 0 ? aiTools : undefined,
      maxTokens: 8192,
      temperature: 0.7,
      onError: (err) => {
        console.error('[Mistral Error]', err?.message || err);
      },
    });

    return result.toDataStreamResponse({
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { content: `Error: ${err.message}` },
      { status: 500 },
    );
  }
}

function mockResponse(messages: any[]) {
  const last = messages[messages.length - 1]?.content || '';
  return [
    `Here's my response to: "${last.slice(0, 100)}..."`,
    '',
    '```python',
    'def hello():',
    '    print("Hello from test mode!")',
    '```',
    '',
    '> **Test Mode** — No real API call made. Set \`MISTRAL_API_KEY\` env var to use real Mistral AI.',
  ].join('\n');
}
