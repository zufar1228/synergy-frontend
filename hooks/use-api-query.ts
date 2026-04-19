/**
 * @file use-api-query.ts
 * @purpose TanStack Query wrappers with Supabase token injection
 * @usedBy All components needing API data fetching/mutation
 * @deps @tanstack/react-query, supabase/client
 * @exports useApiQuery, useApiMutation
 * @sideEffects API calls via provided fetch functions
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions
} from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/demo/api-interceptor';

function useAuthToken() {
  const supabaseRef = useRef(createClient());

  return useCallback(async (): Promise<string> => {
    // In demo mode, skip Supabase and return a static token
    if (isDemoMode()) {
      return 'DEMO_TOKEN';
    }

    const {
      data: { session }
    } = await supabaseRef.current.auth.getSession();

    if (!session) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      throw new Error('No session');
    }

    return session.access_token;
  }, []);
}

/**
 * Convenience hook that combines useQuery with automatic Supabase auth token injection.
 *
 * Usage:
 *   const { data, error, isLoading } = useApiQuery(
 *     ['warehouses'],
 *     (token) => getWarehouses(token)
 *   );
 */
export function useApiQuery<T>(
  queryKey: readonly unknown[] | null,
  apiFn: (token: string) => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const getToken = useAuthToken();

  return useQuery<T>({
    queryKey: queryKey as readonly unknown[],
    queryFn: async () => {
      const token = await getToken();
      return apiFn(token);
    },
    enabled: queryKey !== null && (options?.enabled ?? true),
    ...options
  });
}

/**
 * Convenience hook for mutations with automatic auth token injection
 * and optional cache invalidation.
 *
 * Usage:
 *   const mutation = useApiMutation(
 *     (token, data) => createWarehouse(data, token),
 *     { invalidateKeys: [['warehouses']] }
 *   );
 *   mutation.mutate(warehouseData);
 */
export function useApiMutation<TData = unknown, TVariables = void>(
  mutationFn: (token: string, variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> & {
    invalidateKeys?: readonly unknown[][];
  }
) {
  const getToken = useAuthToken();
  const queryClient = useQueryClient();
  const { invalidateKeys, ...mutationOptions } = options ?? {};

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const token = await getToken();
      return mutationFn(token, variables);
    },
    onSuccess: (...args) => {
      if (invalidateKeys) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions
  });
}
