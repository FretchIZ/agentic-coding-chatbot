import { NextResponse } from 'next/server';
import { searchWeb } from '@/lib/search';
import { scanProject, formatTree, searchCode, readFileLines, applyEdit, listFiles } from '@/lib/codebase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const TEST_MODE = !MISTRAL_API_KEY || MISTRAL_API_KEY === 'test';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

const WORKSPACE = process.env.CODEBASE_PATH || process.cwd();

const SYSTEM_PROMPT = `You are an autonomous coding agent. Your job is to help the user with their codebase by:

1. **Exploring** — scan the project structure, read relevant files
2. **Planning** — explain what you will do before making changes
3. **Editing** — make targeted edits across files
4. **Testing** — run commands to verify changes
5. **Debugging** — if something fails, analyze the error and fix it

You have access to these tools:
- \`list_directory(path?)\` — show project structure
- \`read_file(path, startLine?, endLine?)\` — read file contents
- \`search_code(pattern, include?)\` — grep across files
- \`edit_file(file, oldString, newString)\` — make targeted edits
- \`write_file(path, content)\` — create or overwrite a file
- \`execute_command(command)\` — run terminal commands
- \`read_multiple_files(paths)\` — read several files at once

Rules:
- ALWAYS explore before editing. Understand the codebase first.
- Show your plan before making changes.
- Make changes in small, verifiable steps.
- After editing, run tests or build commands to verify.
- If something fails, read the error and fix it.
- Be concise but thorough. Show the user what you changed.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: 'List the project directory structure',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Subdirectory path relative to workspace (optional)' } },
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
        properties: {
          path: { type: 'string', description: 'Relative file path' },
          startLine: { type: 'number', description: 'Starting line number (1-based, optional)' },
          endLine: { type: 'number', description: 'Ending line number (optional)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_multiple_files',
      description: 'Read multiple files at once for context',
      parameters: {
        type: 'object',
        properties: { paths: { type: 'array', items: { type: 'string' }, description: 'Array of relative file paths' } },
        required: ['paths'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_code',
      description: 'Search for a pattern across the codebase',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern to search for' },
          include: { type: 'array', items: { type: 'string' }, description: 'File extensions to include (e.g. [".ts", ".tsx"])' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Make a targeted edit in a file (find and replace)',
      parameters: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Relative file path' },
          oldString: { type: 'string', description: 'The exact text to replace' },
          newString: { type: 'string', description: 'The replacement text' },
        },
        required: ['file', 'oldString', 'newString'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Relative file path' }, content: { type: 'string', description: 'File content' } },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_command',
      description: 'Run a terminal command in the workspace',
      parameters: {
        type: 'object',
        properties: { command: { type: 'string', description: 'The command to run' } },
        required: ['command'],
      },
    },
  },
];

function resolvePath(p: string): string {
  if (p.startsWith('/')) return p;
  return require('path').join(WORKSPACE, p);
}

async function callMistral(messages: any[]): Promise<any> {
  const res = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MISTRAL_API_KEY}` },
    body: JSON.stringify({ model: 'mistral-large-latest', messages, tools: TOOLS, tool_choice: 'auto', max_tokens: 16384, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`Mistral API error: ${await res.text()}`);
  return res.json();
}

async function handleToolCall(tc: any): Promise<string> {
  const name = tc.function?.name;
  let args: any = {};
  try { args = JSON.parse(tc.function?.arguments || '{}'); } catch {}

  switch (name) {
    case 'list_directory': {
      const target = args.path ? resolvePath(args.path) : WORKSPACE;
      const tree = scanProject(target);
      return tree ? formatTree(tree) : 'Could not list directory';
    }
    case 'read_file': {
      const full = resolvePath(args.path);
      const content = readFileLines(full, args.startLine || 1, args.endLine);
      return content !== null ? content : `File not found: ${args.path}`;
    }
    case 'read_multiple_files': {
      const parts: string[] = [];
      for (const p of (args.paths || [])) {
        const full = resolvePath(p);
        const content = readFileLines(full);
        parts.push(`=== ${p} ===\n${content || '(not found)'}`);
      }
      return parts.join('\n\n');
    }
    case 'search_code': {
      const results = searchCode(WORKSPACE, args.pattern, args.include);
      if (results.length === 0) return 'No results found.';
      const grouped = new Map<string, { line: number; content: string }[]>();
      for (const r of results) {
        const rel = r.file.replace(WORKSPACE, '').replace(/^[/\\]/, '');
        if (!grouped.has(rel)) grouped.set(rel, []);
        grouped.get(rel)!.push({ line: r.line, content: r.content });
      }
      let out = `Found ${results.length} result(s):\n`;
      for (const [file, matches] of grouped) {
        out += `\n📄 ${file}\n`;
        for (const m of matches.slice(0, 5)) out += `  ${m.line}: ${m.content.slice(0, 120)}\n`;
        if (matches.length > 5) out += `  ... (+${matches.length - 5} more)\n`;
      }
      return out;
    }
    case 'edit_file': {
      const full = resolvePath(args.file);
      const result = applyEdit({ file: full, oldString: args.oldString, newString: args.newString });
      return result.ok ? `✅ Edited ${args.file}` : `❌ ${result.error}`;
    }
    case 'write_file': {
      const fs = require('fs');
      const path = require('path');
      const full = resolvePath(args.path);
      const dir = path.dirname(full);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(full, args.content, 'utf-8');
      return `✅ Written ${args.path} (${args.content.length} bytes)`;
    }
    case 'execute_command': {
      const { execSync } = require('child_process');
      try {
        const stdout = execSync(args.command, { cwd: WORKSPACE, timeout: 30000, encoding: 'utf-8', maxBuffer: 1024 * 1024 });
        return stdout.slice(0, 5000) || '(no output)';
      } catch (e: any) {
        return (e.stdout || '').slice(0, 5000) || e.message.slice(0, 5000);
      }
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (TEST_MODE) {
      return NextResponse.json({ content: '🤖 Coding agent active (test mode). Set MISTRAL_API_KEY for real execution.' });
    }

    const agentMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let turn = 0;
        const MAX_TURNS = 25;

        try {
          while (turn < MAX_TURNS) {
            turn++;
            const data = await callMistral(agentMessages);
            const choice = data.choices?.[0];
            if (!choice) { controller.enqueue(encoder.encode('No response from model')); break; }

            const msg = choice.message;
            agentMessages.push(msg);

            if (!msg.tool_calls || msg.tool_calls.length === 0) {
              controller.enqueue(encoder.encode(msg.content || ''));
              break;
            }

            // Stream tool call announcements
            for (const tc of msg.tool_calls) {
              controller.enqueue(encoder.encode(`\n\`\`\`tool_call\n🛠️ ${tc.function?.name}...\n\`\`\`\n`));
            }

            for (const tc of msg.tool_calls) {
              const result = await handleToolCall(tc);
              agentMessages.push({ role: 'tool', name: tc.function?.name, content: result, tool_call_id: tc.id });
              controller.enqueue(encoder.encode(`\n\`\`\`tool_result\n${result.slice(0, 1000)}\n\`\`\`\n`));
            }
          }

          if (turn >= MAX_TURNS) controller.enqueue(encoder.encode('\n\n*Reached maximum tool call turns.*'));
          controller.close();
        } catch (e: any) {
          controller.enqueue(encoder.encode(`\n\nError: ${e.message}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (err: any) {
    return NextResponse.json({ content: `Error: ${err.message}` }, { status: 500 });
  }
}
