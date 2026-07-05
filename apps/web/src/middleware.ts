import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
  const isProtected = createRouteMatcher(['/chat(.*)', '/dashboard(.*)']);
  const handler = clerkMiddleware((auth, req) => {
    if (isProtected(req)) {
      auth.protect();
    }
  });

  return handler(request, event);
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};