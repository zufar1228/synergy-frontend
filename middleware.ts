/**
 * @file middleware.ts
 * @purpose Next.js middleware — Supabase session refresh on every request
 * @usedBy Next.js middleware system
 * @deps supabase/middleware
 * @exports middleware, config
 * @sideEffects Refreshes auth cookies
 */

// frontend/middleware.ts
import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// config matcher  tidak perlu diubahh
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.webp$|sw\\.js$|manifest\\.webmanifest$|offline\\.html$).*)'
  ]
};
