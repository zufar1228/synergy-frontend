/**
 * @file analytics.ts
 * @purpose API functions for analytics data retrieval
 * @usedBy Analytics components
 * @deps client (apiFetch)
 * @exports getAnalytics, getAnalyticsDataForSystem
 * @sideEffects HTTP calls (GET)
 */

// frontend/lib/api/analytics.ts
import { apiFetchSafe } from './client';
import type { AnalyticsParams } from './types';

export const getAnalytics = async (
  accessToken: string,
  params: AnalyticsParams
) => {
  const url = new URLSearchParams();
  url.set('area_id', params.areaId);
  if (params.page) url.set('page', params.page);
  if (params.perPage) url.set('per_page', params.perPage);
  if (params.from) url.set('from', params.from);
  if (params.to) url.set('to', params.to);
  if (params.status) url.set('status', params.status);
  if (params.eventType) url.set('event_type', params.eventType);
  if (params.systemState) url.set('system_state', params.systemState);
  if (params.doorState) url.set('door_state', params.doorState);

  return apiFetchSafe(
    `/analytics/${params.systemType}?${url.toString()}`,
    accessToken,
    {
      cache: 'no-store',
      timeoutMs: 45_000
    }
  );
};

export const getAnalyticsDataForSystem = async (
  systemType: string,
  areaId: string,
  page: string,
  accessToken: string,
  dateParams: { from: string; to: string }
) => {
  return getAnalytics(accessToken, {
    systemType,
    areaId,
    page,
    from: dateParams.from,
    to: dateParams.to
  });
};
