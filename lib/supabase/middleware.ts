// frontend/lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { env } from '@/lib/env';

export async function updateSession(request: NextRequest) {
  // --- Demo Mode Bypass ---
  const isDemoMode = request.cookies.get('demo-mode')?.value === 'true';
  if (isDemoMode) {
    const requestedPath = request.nextUrl.pathname;
    // In demo mode, allow /login to redirect to dashboard (consistent behavior)
    if (requestedPath === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Allow all other routes through
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers }
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers }
          });
          response.cookies.set({ name, value: '', ...options });
        }
      }
    }
  );

  const requestedPath = request.nextUrl.pathname;

  const publicPaths = [
    '/login',
    '/demo',
    '/setup-account',
    '/auth/confirm',
    '/auth/callback',
    '/calibration',
    '/manifest.webmanifest',
    '/sw.js',
    '/offline.html',
    '/favicon.ico',
    '/window.svg',
    '/file.svg'
  ];

  // Ambil user untuk verifikasi — getUser() validates with the Supabase server
  // and is the recommended way to check auth in middleware.
  // If the refresh token is invalid/expired, this will fail gracefully.
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // On auth errors (e.g. invalid refresh token), redirect to login for non-public paths
    if (!publicPaths.some((path) => requestedPath.startsWith(path))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    // User is authenticated — check role-based access via session JWT
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const jwt = jwtDecode(session.access_token) as {
        role?: string;
        app_metadata?: { role?: string };
      };
      // Cek role dari app_metadata terlebih dahulu, fallback ke root level, lalu default 'user'
      const userRole = jwt.app_metadata?.role || jwt.role || 'user';
      console.log('[Middleware] Path:', requestedPath, 'Role:', userRole);

      // Jika pengguna mencoba mengakses halaman manajemen tapi bukan admin
      if (
        requestedPath.startsWith('/management/users') &&
        userRole !== 'super_admin'
      ) {
        // Jika bukan super_admin mencoba akses, lempar ke dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (
        requestedPath.startsWith('/management') &&
        !['admin', 'super_admin'].includes(userRole)
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Jika pengguna sudah login dan mencoba mengakses halaman login
      if (requestedPath === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('[Middleware] Error decoding JWT:', error);
      // If JWT decoding fails, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}
