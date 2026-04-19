/**
 * @file user-profile-display.tsx
 * @purpose Displays user profile info (name, role, avatar)
 * @usedBy NavUser, ProfilePage
 * @deps Avatar UI
 * @exports UserProfileDisplay
 * @sideEffects None
 */

// frontend/components/user-profile-display.tsx
"use client";

import { useUserProfile } from "@/hooks/use-user-profile";

interface UserProfileDisplayProps {
  fallbackName?: string;
}

export function UserProfileDisplay({
  fallbackName = "Loading...",
}: UserProfileDisplayProps) {
  const { profile, loading, error } = useUserProfile();

  if (loading) return <span>{fallbackName}</span>;
  if (error) return <span>Profile unavailable</span>;

  return <span>{profile?.username || fallbackName}</span>;
}
