import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  response.cookies.set('demo-mode', 'true', {
    path: '/',
    maxAge: 3600,
    sameSite: 'lax',
    httpOnly: false,
  });

  return response;
}