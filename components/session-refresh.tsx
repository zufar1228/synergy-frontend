// frontend/components/session-refresh.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SessionRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (event === "TOKEN_REFRESHED") {
        console.log("[SessionRefresh] Token refreshed successfully");
      } else if (event === "USER_UPDATED") {
        router.refresh();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
