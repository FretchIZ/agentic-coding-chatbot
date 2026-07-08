import { NextResponse } from 'next/server';
import { searchWeb } from '@/lib/search';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const TEST_MODE = !MISTRAL_API_KEY || MISTRAL_API_KEY === 'test';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'execute_command',
      description: 'Execute a terminal command in the workspace',
      parameters: {
        type: 'object',
        properties: { command: { type: 'string', description: 'The command to run' } },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a file from the workspace',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Relative file path' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file in the workspace',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Relative file path' }, content: { type: 'string', description: 'File content' } },
        required: ['path', 'content'],
      },
    },
  },
];

const BASE_PAYLOAD = {
  model: 'mistral-large-latest',
  max_tokens: 8192,
  temperature: 0.7,
};

async function callMistral(messages: any[], stream = false): Promise<any> {
  const res = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify({ ...BASE_PAYLOAD, messages, tools: TOOLS, tool_choice: 'auto', stream }),
  });
  if (!res.ok) throw new Error(`Mistral API error: ${await res.text()}`);
  return stream ? res : res.json();
}

function getBase(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}

async function executeToolCall(tc: any): Promise<string> {
  const name = tc.function?.name;
  let args: any = {};
  try { args = JSON.parse(tc.function?.arguments || '{}'); } catch {}
  const base = getBase();

  if (name === 'execute_command') {
    const res = await fetch(`${base}/api/execute`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: args.command }),
    });
    const data = await res.json();
    return [`Exit: ${data.exitCode || 0}`, data.stdout && `STDOUT:\n${data.stdout}`, data.stderr && `STDERR:\n${data.stderr}`, `(took ${data.elapsed || 0}ms)`].filter(Boolean).join('\n');
  }

  if (name === 'read_file') {
    const res = await fetch(`${base}/api/execute?path=${encodeURIComponent(args.path)}`);
    if (!res.ok) return `Error: file not found`;
    const data = await res.json();
    return data.content || '(empty)';
  }

  if (name === 'write_file') {
    await fetch(`${base}/api/execute`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: args.path, content: args.content }),
    });
    return `Written: ${args.path}`;
  }

  return `Unknown tool: ${name}`;
}

export async function POST(req: Request) {
  try {
    const { messages, webSearch, execute } = await req.json();

    if (TEST_MODE) return NextResponse.json({ content: mockResponse(messages) });

    let mistralMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));

    if (webSearch && messages.length > 0) {
      const last = messages[messages.length - 1]?.content;
      if (last) {
        const results = await searchWeb(last);
        if (results) mistralMessages = [{ role: 'system', content: `Web search results:\n${results}\n\nAnswer based on these.` }, ...mistralMessages];
      }
    }

    if (!execute) {
      const res = await callMistral(mistralMessages, true);
      if (!res.ok) return NextResponse.json({ content: `Mistral API error (${res.status}): ${await res.text()}` });
      if (!res.body) return NextResponse.json({ content: 'Empty response' });
      return new Response(res.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
    }

    let turn = 0;
    const MAX_TURNS = 10;

    while (turn < MAX_TURNS) {
      turn++;
      const data = await callMistral(mistralMessages, false);
      const choice = data.choices?.[0];
      if (!choice) return NextResponse.json({ content: 'No response' });

      const msg = choice.message;
      mistralMessages.push(msg);

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        const text = msg.content || '';
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            controller.enqueue(encoder.encode(text));
            controller.close();
          },
        });
        return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
      }

      for (const tc of msg.tool_calls) {
        const result = await executeToolCall(tc);
        mistralMessages.push({ role: 'tool', name: tc.function?.name, content: result, tool_call_id: tc.id });
      }
    }

    return NextResponse.json({ content: 'Reached maximum tool call turns.' });
  } catch (err: any) {
    console.error('Chat API error:', err);
    return NextResponse.json({ content: `Error: ${err.message}` }, { status: 500 });
  }
}

function mockResponse(messages: any[]) {
  const last = messages[messages.length - 1]?.content || '';
  return [`Mock: "${last.slice(0, 100)}..."`, '', '```\n# Test mode - set MISTRAL_API_KEY\n```'].join('\n');
}
