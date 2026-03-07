"use client";

import { useCallback } from "react";
import { useApiSWR } from "./use-swr-api";
import { getWarehouses } from "@/lib/api";
import type { Warehouse } from "@/lib/api";

/**
 * SWR hook for fetching warehouses.
 * Data is cached globally and shared across warehouse-selector and dashboard.
 */
export function useWarehouses() {
  const fetcher = useCallback(
    (token: string) => getWarehouses(token),
    []
  );

  const { data, error, isLoading, mutate } = useApiSWR<Warehouse[]>(
    "warehouses",
    fetcher
  );

  return {
    warehouses: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
