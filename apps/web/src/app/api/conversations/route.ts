import { NextResponse } from 'next/server';
import { prisma } from '@codeagent/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function dbAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

export async function GET() {
  if (!dbAvailable()) return NextResponse.json([]);
  try {
    const chats = await prisma.chat.findMany({ orderBy: { updatedAt: 'desc' } });
    return NextResponse.json(chats.map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), messages: [] })));
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  if (!dbAvailable()) {
    const { title } = await req.json().catch(() => ({}));
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const now = new Date().toISOString();
    return NextResponse.json({ id, title: title || 'New Chat', messages: [], createdAt: now, updatedAt: now });
  }
  try {
    const { title } = await req.json();
    const chat = await prisma.chat.create({ data: { title: title || 'New Chat' } });
    return NextResponse.json({ id: chat.id, title: chat.title, messages: [], createdAt: chat.createdAt.toISOString(), updatedAt: chat.updatedAt.toISOString() });
  } catch { return NextResponse.json({ error: 'Failed to create' }, { status: 500 }); }
}
