// frontend/components/session-refresh.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isDemoMode } from "@/lib/demo/api-interceptor";

export function SessionRefresh() {
  const router = useRouter();

  useEffect(() => {
    // Skip all auth listeners in demo mode
    if (isDemoMode()) return;

    const supabase = createClient();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login?message=Sesi%20berakhir.%20Silakan%20login%20kembali.");
      } else if (event === "TOKEN_REFRESHED") {
        console.log("[SessionRefresh] Token refreshed successfully");
      } else if (event === "USER_UPDATED") {
        router.refresh();
      }
    });

    const handleUnauthorized = async () => {
      // Sesi kedaluwarsa, hapus sisa sesi dan redirect ke login
      await supabase.auth.signOut();
      window.location.href = "/login?message=Sesi%20berakhir.%20Silakan%20login%20kembali.";
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [router]);

  return null;
}
