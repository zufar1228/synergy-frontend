"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

/**
 * Global SWR configuration provider.
 *
 * - revalidateOnFocus: auto-refresh when the user switches tabs back
 * - dedupingInterval: deduplicate identical requests within 5 seconds
 * - errorRetryCount: stop retrying after 3 failures
 * - shouldRetryOnError: don't retry on 4xx errors (only network/5xx)
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        dedupingInterval: 5000,
        errorRetryCount: 3,
        shouldRetryOnError: (err: any) => {
          // Don't retry 4xx errors (auth, not found, etc.)
          if (err?.status && err.status >= 400 && err.status < 500) {
            return false;
          }
          return true;
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
