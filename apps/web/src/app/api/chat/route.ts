import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TEST_MODE = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-test';

export async function POST(req: Request) {
  try {
    const { messages, tools } = await req.json();

    if (TEST_MODE) {
      return NextResponse.json({
        content: mockResponse(messages),
      });
    }

    const { createAnthropic } = await import('@ai-sdk/anthropic');
    const { streamText, tool } = await import('ai');
    const { z } = await import('zod');

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
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
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      tools: Object.keys(aiTools).length > 0 ? aiTools : undefined,
      maxTokens: 8192,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const stream = result.textStream;
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (e: any) {
          const msg = e?.message || String(e);
          controller.enqueue(encoder.encode(`\n\n**API Error:** ${msg}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
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
    '> **Test Mode** — No real API call made. Set `ANTHROPIC_API_KEY` env var to use real Anthropic Claude.',
  ].join('\n');
}
