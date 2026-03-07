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

  return apiFetchSafe(
    `/analytics/${params.systemType}?${url.toString()}`,
    accessToken,
    { cache: 'no-store' }
  );
};

export const getAnalyticsDataForSystem = async (
  systemType: string,
  areaId: string,
  page: string,
  accessToken: string,
  dateParams: { from: string; to: string }
) => {
  const url = new URLSearchParams();
  url.set('area_id', areaId);
  url.set('page', page);
  url.set('from', dateParams.from);
  url.set('to', dateParams.to);

  return apiFetchSafe(
    `/analytics/${systemType}?${url.toString()}`,
    accessToken,
    { cache: 'no-store' }
  );
};
