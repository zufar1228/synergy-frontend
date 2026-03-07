"use client";

import { useCallback } from "react";
import { useApiSWR } from "./use-swr-api";
import { getNavAreasBySystem } from "@/lib/api";
import type { NavArea } from "@/lib/api";

interface NavAreasData {
  keamanan: NavArea[];
  intrusi: NavArea[];
  lingkungan: NavArea[];
}

/**
 * SWR hook for fetching navigation areas for all system types.
 * Fetches keamanan, intrusi, and lingkungan areas in parallel.
 * Cached globally so sidebar navigation doesn't re-fetch on every render.
 */
export function useNavAreas() {
  const fetcher = useCallback(
    async (token: string): Promise<NavAreasData> => {
      const [keamanan, intrusi, lingkungan] = await Promise.all([
        getNavAreasBySystem("keamanan", token),
        getNavAreasBySystem("intrusi", token),
        getNavAreasBySystem("lingkungan", token),
      ]);
      return { keamanan, intrusi, lingkungan };
    },
    []
  );

  const { data, error, isLoading, mutate } = useApiSWR<NavAreasData>(
    "nav-areas",
    fetcher,
    {
      revalidateOnFocus: false, // Navigation data rarely changes
      dedupingInterval: 30000,  // Cache for 30s
    }
  );

  return {
    securityAreas: data?.keamanan ?? [],
    intrusiAreas: data?.intrusi ?? [],
    lingkunganAreas: data?.lingkungan ?? [],
    error,
    isLoading,
    mutate,
  };
}
