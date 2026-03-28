// frontend/lib/api/intrusi.ts
import { apiFetch } from '@/lib/api/client';
import type {
  IntrusiLog,
  IntrusiSummary,
  IntrusiStatus,
  IntrusiEventType,
  IntrusiCommandPayload,
  UpdateIncidentStatusPayload
} from '@/lib/api/types';

/** Get intrusion logs for a device with pagination and filters */
export const getIntrusiLogs = async (
  token: string,
  deviceId: string,
  options?: {
    limit?: number;
    offset?: number;
    from?: string;
    to?: string;
    event_type?: IntrusiEventType;
  }
): Promise<{
  data: IntrusiLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}> => {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  if (options?.from) params.set('from', options.from);
  if (options?.to) params.set('to', options.to);
  if (options?.event_type) params.set('event_type', options.event_type);

  return apiFetch(
    `/intrusi/devices/${deviceId}/logs?${params.toString()}`,
    token
  );
};

/** Get intrusion summary for a device */
export const getIntrusiSummary = async (
  token: string,
  deviceId: string,
  from?: string,
  to?: string
): Promise<IntrusiSummary> => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const json = await apiFetch<{ data: IntrusiSummary }>(
    `/intrusi/devices/${deviceId}/summary?${params.toString()}`,
    token
  );
  return json.data;
};

/** Get current door security status for a device */
export const getIntrusiStatus = async (
  token: string,
  deviceId: string
): Promise<IntrusiStatus> => {
  const json = await apiFetch<{ data: IntrusiStatus }>(
    `/intrusi/devices/${deviceId}/status`,
    token
  );
  return json.data;
};

/** Update acknowledgement status for an intrusion log */
export const updateIntrusiLogStatus = (
  logId: string,
  data: UpdateIncidentStatusPayload,
  token: string
): Promise<IntrusiLog> =>
  apiFetch(`/intrusi/logs/${logId}/status`, token, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

/** Send a command to an intrusi (door security) device */
export const sendIntrusiCommand = (
  token: string,
  deviceId: string,
  command: IntrusiCommandPayload
): Promise<{ message: string; device_id: string; command: string }> =>
  apiFetch(`/intrusi/devices/${deviceId}/command`, token, {
    method: 'POST',
    body: JSON.stringify(command)
  });
