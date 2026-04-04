'use client';

import { useCallback } from 'react';
import { useApiQuery } from './use-api-query';
import { getWarehouses } from '@/lib/api';
import type { Warehouse } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function useWarehouses() {
  const fetcher = useCallback((token: string) => getWarehouses(token), []);

  const { data, error, isLoading } = useApiQuery<Warehouse[]>(
    ['warehouses'],
    fetcher
  );

  const queryClient = useQueryClient();
  const mutate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
    [queryClient]
  );

  return {
    warehouses: data ?? [],
    error,
    isLoading,
    mutate
  };
}
