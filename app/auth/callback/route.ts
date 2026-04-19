/**
 * @file route.ts
 * @purpose Supabase auth callback handler — exchanges code for session
 * @usedBy Supabase OAuth/magic link redirect
 * @deps supabase/server
 * @exports GET
 * @sideEffects Sets auth cookies, redirects
 */

// frontend/app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { verifyUserAccess } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // jika ada, 'next' akan digunakan untuk mengarahkan setelah login
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && sessionData?.session) {
      // Verify if user is authorized (was invited or manually added)
      try {
        const accessResult = await verifyUserAccess(sessionData.session.access_token);
        
        if (!accessResult.authorized) {
          // User not authorized - sign them out and redirect to login with error
          await supabase.auth.signOut();
          const errorMessage = encodeURIComponent(accessResult.message);
          return NextResponse.redirect(`${origin}/login?message=${errorMessage}`);
        }
        
        // User is authorized, proceed to dashboard
        return NextResponse.redirect(`${origin}${next}`);
      } catch (verifyError) {
        console.error("Error verifying user access:", verifyError);
        // On error, sign out to be safe and redirect with error
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?message=Gagal memverifikasi akses. Silakan coba lagi.`
        );
      }
    }
  }

  // URL untuk kembali ke jika terjadi error
  return NextResponse.redirect(
    `${origin}/login?message=Could not authenticate user`
  );
}
