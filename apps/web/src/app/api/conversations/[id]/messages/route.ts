import { NextResponse } from 'next/server';
import { getPrisma } from '@codeagent/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function dbAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, content } = await req.json();
  if (!dbAvailable()) return NextResponse.json({ ok: true });
  try {
    const p = getPrisma();
    await p.message.create({ data: { chatId: id, role: role || 'user', content: content || '' } });
    await p.chat.update({ where: { id }, data: { updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
