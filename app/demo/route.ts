/**
 * @file route.ts
 * @purpose Demo mode entry route — sets demo cookie and redirects to dashboard
 * @usedBy Public demo link
 * @deps None
 * @exports GET
 * @sideEffects Sets demo cookie, redirects
 */

import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  response.cookies.set('demo-mode', 'true', {
    path: '/',
    maxAge: 3600,
    sameSite: 'lax',
    httpOnly: false
  });

  return response;
}
