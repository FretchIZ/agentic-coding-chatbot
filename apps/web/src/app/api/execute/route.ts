import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WORKSPACE = join(tmpdir(), 'sai-workspace');
const TIMEOUT = 30000;
const MAX_OUTPUT = 10000;

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//, /format\s+[c-z]:/, /mkfs/, /dd\s+if=/, /:\(\)\s*\{/, />\s*\/dev\//,
];

function blocked(cmd: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(cmd));
}

function ensureDir() {
  try { mkdirSync(WORKSPACE, { recursive: true }); } catch {}
}

export async function POST(req: Request) {
  try {
    const { command, language } = await req.json();
    if (!command) return NextResponse.json({ error: 'No command' }, { status: 400 });

    if (blocked(command)) {
      return NextResponse.json({ output: '', error: 'Command blocked for safety' });
    }

    ensureDir();

    const start = Date.now();
    let stdout = '', stderr = '';

    try {
      const result = execSync(command, {
        cwd: WORKSPACE,
        timeout: TIMEOUT,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      });
      stdout = (result || '').slice(0, MAX_OUTPUT);
    } catch (e: any) {
      stdout = (e.stdout || '').slice(0, MAX_OUTPUT);
      stderr = (e.stderr || e.message || '').slice(0, MAX_OUTPUT);
    }

    const elapsed = Date.now() - start;

    return NextResponse.json({
      stdout,
      stderr,
      exitCode: stderr ? 1 : 0,
      elapsed,
      cwd: WORKSPACE,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { path, content } = await req.json();
    if (!path) return NextResponse.json({ error: 'No path' }, { status: 400 });
    ensureDir();
    const fullPath = join(WORKSPACE, path);
    writeFileSync(fullPath, content || '', 'utf-8');
    return NextResponse.json({ ok: true, path: fullPath });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'No path' }, { status: 400 });
  try {
    const content = readFileSync(join(WORKSPACE, path), 'utf-8');
    return NextResponse.json({ content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
