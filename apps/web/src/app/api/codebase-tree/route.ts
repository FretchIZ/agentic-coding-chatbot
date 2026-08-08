import { NextResponse } from 'next/server';
import { scanProject, listFiles } from '@/lib/codebase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WORKSPACE = process.env.CODEBASE_PATH || process.cwd();

export async function GET() {
  try {
    const tree = scanProject(WORKSPACE);
    const files = listFiles(WORKSPACE);
    return NextResponse.json({ root: WORKSPACE, tree, fileCount: files.length, files: files.slice(0, 200) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
