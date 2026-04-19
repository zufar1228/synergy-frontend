/**
 * @file use-nav-areas.ts
 * @purpose Hook to fetch navigation areas grouped by system type
 * @usedBy AppSidebar, AppNavigation, MobileSidebar
 * @deps useApiQuery, lib/api/navigation
 * @exports useNavAreas
 * @sideEffects API call (getNavAreasBySystem)
 */

'use client';

import { useCallback } from 'react';
import { useApiQuery } from './use-api-query';
import { getNavAreasBySystem } from '@/lib/api';
import type { NavArea } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface NavAreasData {
  keamanan: NavArea[];
  intrusi: NavArea[];
  lingkungan: NavArea[];
}

export function useNavAreas() {
  const fetcher = useCallback(async (token: string): Promise<NavAreasData> => {
    const [keamanan, intrusi, lingkungan] = await Promise.all([
      getNavAreasBySystem('keamanan', token),
      getNavAreasBySystem('intrusi', token),
      getNavAreasBySystem('lingkungan', token)
    ]);
    return { keamanan, intrusi, lingkungan };
  }, []);

  const { data, error, isLoading } = useApiQuery<NavAreasData>(
    ['nav-areas'],
    fetcher,
    {
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  );

  const queryClient = useQueryClient();
  const mutate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['nav-areas'] }),
    [queryClient]
  );

  return {
    securityAreas: data?.keamanan ?? [],
    intrusiAreas: data?.intrusi ?? [],
    lingkunganAreas: data?.lingkungan ?? [],
    error,
    isLoading,
    mutate
  };
}
