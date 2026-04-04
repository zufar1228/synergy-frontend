// frontend/hooks/use-user-profile.ts
'use client';

import { useCallback } from 'react';
import { useApiQuery } from './use-api-query';
import { getMyProfile } from '@/lib/api';
import type { Profile } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function useUserProfile() {
  const fetcher = useCallback((token: string) => getMyProfile(token), []);

  const { data, error, isLoading } = useApiQuery<Profile>(
    ['user-profile'],
    fetcher,
    {
      refetchOnWindowFocus: false,
      staleTime: 60000
    }
  );

  const queryClient = useQueryClient();
  const mutate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
    [queryClient]
  );

  return {
    profile: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    mutate
  };
}
