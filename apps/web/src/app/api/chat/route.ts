import { NextResponse } from 'next/server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages, tools: mcpTools } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ content: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in env.' });
    }

    const anthropic = createAnthropic({ apiKey });

    const aiTools: Record<string, any> = {};
    if (mcpTools) {
      for (const t of mcpTools) {
        aiTools[t.name] = tool({
          description: t.description,
          parameters: z.object({
            task: z.string().describe(t.description),
            context: z.string().optional().describe('Additional context'),
          }),
        });
      }
    }

    const stream = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      tools: Object.keys(aiTools).length > 0 ? aiTools : undefined,
      maxTokens: 8192,
      temperature: 0.7,
    });

    return stream.toTextStreamResponse();
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json({ content: `Error: ${err.message}` }, { status: 500 });
  }
}
