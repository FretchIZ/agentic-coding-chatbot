import { NextResponse } from 'next/server';
import { prisma } from '@codeagent/database';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function dbAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbAvailable()) return NextResponse.json(null, { status: 404 });
  try {
    const chat = await prisma.chat.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    if (!chat) return NextResponse.json(null, { status: 404 });
    return NextResponse.json({ id: chat.id, title: chat.title, messages: chat.messages.map((m) => ({ role: m.role, content: m.content })), createdAt: chat.createdAt.toISOString(), updatedAt: chat.updatedAt.toISOString() });
  } catch { return NextResponse.json(null, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!dbAvailable()) return NextResponse.json({ ok: true });
  try { await prisma.chat.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: 'Failed to delete' }, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, messages } = await req.json();
  if (!dbAvailable()) return NextResponse.json({ ok: true });
  try {
    const data: any = {};
    if (title) data.title = title;
    if (messages) {
      await prisma.message.deleteMany({ where: { chatId: id } });
      await prisma.message.createMany({ data: messages.map((m: any) => ({ chatId: id, role: m.role, content: m.content })) });
    }
    if (Object.keys(data).length > 0) await prisma.chat.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Failed to update' }, { status: 500 }); }
}
