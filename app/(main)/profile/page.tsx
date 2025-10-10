// frontend/app/(main)/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMyProfile, Profile } from "@/lib/api";
import { UpdateProfileForm } from "@/components/profile/UpdateProfileForm";
import { UpdatePasswordForm } from "@/components/profile/UpdatePasswordForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        try {
          const profileData = await getMyProfile(session.access_token);
          setProfile(profileData);
        } catch (err) {
          setError("Gagal memuat profil.");
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Profil Saya</h1>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Profil Saya</h1>
      <div className="space-y-6">
        {profile && <UpdateProfileForm profile={profile} />}
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
