// frontend/hooks/use-user-profile.ts
"use client";

import { useEffect, useState } from "react";
import { getMyProfile } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useUserProfile() {
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError("No session");
          return;
        }

        const userProfile = await getMyProfile(session.access_token);
        setProfile(userProfile);
      } catch (err: any) {
        console.error("Failed to fetch user profile:", err);
        setError(err.message || "Failed to load profile");
        toast.error(
          "Failed to load user profile. Some features may be limited."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
}
