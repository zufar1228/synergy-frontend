"use client";

import useSWR, { type SWRResponse, type SWRConfiguration } from "swr";
import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns a fetcher function that auto-injects the Supabase auth token.
 * The fetcher accepts (apiFunction, ...args) — it grabs the session token
 * and calls apiFunction(token, ...args) or apiFunction(...args, token)
 * depending on the signature.
 */
export function useAuthFetcher() {
  // Cache the supabase client across renders
  const supabaseRef = useRef(createClient());

  const fetcher = useCallback(
    async <T,>(apiFn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> => {
      const {
        data: { session },
      } = await supabaseRef.current.auth.getSession();

      if (!session) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        }
        throw new Error("No session");
      }

      // Call the API function with the token as the last argument
      return apiFn(...args, session.access_token);
    },
    []
  );

  return fetcher;
}

/**
 * Convenience hook that combines useSWR with automatic auth token injection.
 *
 * Usage:
 *   const { data, error, isLoading } = useApiSWR(
 *     'warehouses',            // cache key
 *     () => getWarehouses      // API function (receives token automatically)
 *   );
 *
 * For keys with params:
 *   const { data } = useApiSWR(
 *     deviceId ? ['nav-areas', systemType] : null,
 *     () => getNavAreasBySystem(systemType)  // called with token injected
 *   );
 */
export function useApiSWR<T>(
  key: string | any[] | null,
  apiFn: (token: string) => Promise<T>,
  config?: SWRConfiguration<T>
): SWRResponse<T> {
  const supabaseRef = useRef(createClient());

  const fetcher = useCallback(async (): Promise<T> => {
    const {
      data: { session },
    } = await supabaseRef.current.auth.getSession();

    if (!session) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      throw new Error("No session");
    }

    return apiFn(session.access_token);
  }, [apiFn]);

  return useSWR<T>(key, fetcher, config);
}
