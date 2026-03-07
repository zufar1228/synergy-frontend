"use client";

import { useCallback } from "react";
import { useApiSWR } from "./use-swr-api";
import { getTelegramMembers } from "@/lib/api";
import type { TelegramSubscriber } from "@/lib/api";

/**
 * SWR hook for fetching Telegram group members.
 * Pass `showInactive` to include/exclude inactive members.
 * Returns `mutate` for refreshing after kick/invite actions.
 */
export function useTelegramMembers(showInactive: boolean) {
  const fetcher = useCallback(
    (token: string) => getTelegramMembers(token, showInactive),
    [showInactive]
  );

  const { data, error, isLoading, mutate } = useApiSWR<TelegramSubscriber[]>(
    ["telegram-members", showInactive],
    fetcher
  );

  return {
    members: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
