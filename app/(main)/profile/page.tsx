// frontend/app/(main)/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getMyProfile,
  Profile,
  getMyPreferences,
  NotificationPreference,
} from "@/lib/api";
import { UpdateProfileForm } from "@/components/profile/UpdateProfileForm";
import { UpdatePasswordForm } from "@/components/profile/UpdatePasswordForm";
import { UpdatePreferencesForm } from "@/components/profile/UpdatePreferencesForm";
import { PushNotificationManager } from "@/components/profile/PushNotificationManager";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<
    NotificationPreference[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchProfileData = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        try {
          // Ambil profil dan preferensi secara bersamaan
          const [profileData, preferenceData] = await Promise.all([
            getMyProfile(session.access_token),
            getMyPreferences(session.access_token),
          ]);
          setProfile(profileData);
          setPreferences(preferenceData);
        } catch (err) {
          setError("Gagal memuat data profil.");
        }
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [mounted]);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Profil Saya</h1>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Profil Saya</h1>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
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
        {preferences && <UpdatePreferencesForm initialData={preferences} />}
        <PushNotificationManager />
      </div>
    </div>
  );
}
