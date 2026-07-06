import { NextResponse } from 'next/server';
import { agents } from '@/lib/agents';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(agents);
}
