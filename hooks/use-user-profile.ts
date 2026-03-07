// frontend/hooks/use-user-profile.ts
"use client";

import { useCallback } from "react";
import { useApiSWR } from "./use-swr-api";
import { getMyProfile } from "@/lib/api";
import type { Profile } from "@/lib/api";

/**
 * SWR hook for the current user's profile.
 * Cached globally — used by header, sidebar, profile page.
 */
export function useUserProfile() {
  const fetcher = useCallback(
    (token: string) => getMyProfile(token),
    []
  );

  const { data, error, isLoading, mutate } = useApiSWR<Profile>(
    "user-profile",
    fetcher,
    {
      revalidateOnFocus: false, // Profile rarely changes
      dedupingInterval: 60000,  // Cache for 60s
    }
  );

  return {
    profile: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    mutate,
  };
}
