import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const TEST_MODE = !MISTRAL_API_KEY || MISTRAL_API_KEY === 'test';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (TEST_MODE) {
      return NextResponse.json({ content: mockResponse(messages) });
    }

    const mistralMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: mistralMessages,
        stream: true,
        max_tokens: 8192,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ content: `Mistral API error (${res.status}): ${err}` });
    }

    if (!res.body) {
      return NextResponse.json({ content: 'Empty response from Mistral' });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
      start(controller) {
        const reader = res.body!.getReader();

        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(Boolean);

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const json = line.slice(6).trim();
              if (json === '[DONE]') continue;

              try {
                const parsed = JSON.parse(json);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // skip malformed lines
              }
            }

            push();
          }).catch((e) => {
            controller.enqueue(encoder.encode(`\n\nStream error: ${e.message}`));
            controller.close();
          });
        }

        push();
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
    return NextResponse.json({ content: `Error: ${err.message}` }, { status: 500 });
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
    '> **Test Mode** — No real API call made. Set `MISTRAL_API_KEY` env var to use real Mistral AI.',
  ].join('\n');
}
