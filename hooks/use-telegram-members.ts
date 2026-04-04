'use client';

import { useCallback } from 'react';
import { useApiQuery } from './use-api-query';
import { getTelegramMembers } from '@/lib/api';
import type { TelegramSubscriber } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function useTelegramMembers(showInactive: boolean) {
  const fetcher = useCallback(
    (token: string) => getTelegramMembers(token, showInactive),
    [showInactive]
  );

  const { data, error, isLoading } = useApiQuery<TelegramSubscriber[]>(
    ['telegram-members', showInactive],
    fetcher
  );

  const queryClient = useQueryClient();
  const mutate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['telegram-members'] }),
    [queryClient]
  );

  return {
    members: data ?? [],
    error,
    isLoading,
    mutate
  };
}
