// frontend/lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode"; // <-- IMPORT jwt-decode

export async function updateSession(request: NextRequest) {
  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in middleware');
    // If environment variables are missing, redirect to login for all routes
    const requestedPath = request.nextUrl.pathname;
    if (requestedPath !== '/login') {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Ambil sesi (yang berisi access_token)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const requestedPath = request.nextUrl.pathname;

  const publicPaths = [
    "/login",
    "/setup-account",
    "/auth/confirm",
    "/auth/callback",
  ];

  // 1. Jika tidak ada sesi/pengguna dan mencoba mengakses halaman selain login
  if (!session && !publicPaths.some((path) => requestedPath.startsWith(path))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Jika ada sesi, lakukan pengecekan otorisasi
  if (session) {
    try {
      // Decode JWT untuk mendapatkan peran secara pasti
      const jwt = jwtDecode(session.access_token) as { role?: string };
      const userRole = jwt.role || "user";
      console.log(
        "[Middleware] Path:",
        requestedPath,
        "Role:",
        userRole
      );

      // Jika pengguna mencoba mengakses halaman manajemen tapi bukan admin
      if (
        requestedPath.startsWith("/management/users") &&
        userRole !== "super_admin"
      ) {
        // Jika bukan super_admin mencoba akses, lempar ke dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (
        requestedPath.startsWith("/management") &&
        !["admin", "super_admin"].includes(userRole)
      ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Jika pengguna sudah login dan mencoba mengakses halaman login
      if (requestedPath === "/login") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      console.error("[Middleware] Error decoding JWT:", error);
      // If JWT decoding fails, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}
