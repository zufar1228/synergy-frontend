// frontend/lib/api/lingkungan.ts
import { apiFetch, apiFetchSafe } from './client';
import type {
  LingkunganLog,
  LingkunganStatus,
  UpdateIncidentStatusPayload,
} from './types';

/** Get current lingkungan device status */
export const getLingkunganStatus = async (
  token: string,
  deviceId: string
): Promise<LingkunganStatus> => {
  const json = await apiFetch<{ data: LingkunganStatus }>(
    `/lingkungan/devices/${deviceId}/status`,
    token,
    { cache: 'no-store' }
  );
  return json.data;
};

/** Get lingkungan chart data */
export const getLingkunganChart = async (
  accessToken: string,
  deviceId: string,
  from?: string,
  to?: string,
  limit: number = 100
) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (limit) params.set('limit', limit.toString());

  return apiFetchSafe<{ data: { actual: any[]; predictions: any[] } }>(
    `/lingkungan/devices/${deviceId}/chart?${params.toString()}`,
    accessToken,
    { cache: 'no-store' }
  );
};

/** Send a control command (fan/dehumidifier/mode) to a lingkungan device */
export const sendLingkunganControl = (
  token: string,
  deviceId: string,
  command: { fan?: string; dehumidifier?: string; mode?: string }
): Promise<{ message: string }> =>
  apiFetch(`/lingkungan/devices/${deviceId}/control`, token, {
    method: 'POST',
    body: JSON.stringify(command),
  });

/** Update acknowledgement status for a lingkungan log */
export const updateLingkunganLogStatus = (
  logId: string,
  data: UpdateIncidentStatusPayload,
  token: string
): Promise<LingkunganLog> =>
  apiFetch(`/lingkungan/logs/${logId}/status`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
