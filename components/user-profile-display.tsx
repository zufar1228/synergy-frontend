// frontend/components/user-profile-display.tsx
"use client";

import { useEffect, useState } from "react";
import { getMyProfile } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UserProfileDisplayProps {
  fallbackName?: string;
}

export function UserProfileDisplay({
  fallbackName = "Loading...",
}: UserProfileDisplayProps) {
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

  if (loading) return <span>{fallbackName}</span>;
  if (error) return <span>Profile unavailable</span>;

  return <span>{profile?.username || fallbackName}</span>;
}
