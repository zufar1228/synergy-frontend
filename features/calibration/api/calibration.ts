import { env } from '@/lib/env';

const CAL_BASE_URL = env.NEXT_PUBLIC_API_URL + '/api-cal';

async function calFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${CAL_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }

  return res.json();
}

/** Send a calibration command to a device */
export const sendCommand = (
  deviceId: string,
  cmd: string,
  extra?: Record<string, unknown>
) =>
  calFetch<{ message: string }>('/command', {
    method: 'POST',
    body: JSON.stringify({ deviceId, cmd, ...extra }),
  });

/** Get latest device status */
export const getDeviceStatus = (deviceId: string) =>
  calFetch<{ data: CalibrationDeviceStatus | null }>(`/status/${deviceId}`);

/** Get raw data for a session */
export const getRawData = (
  session: string,
  options?: { trial?: number; limit?: number; offset?: number }
) => {
  const params = new URLSearchParams();
  if (options?.trial) params.set('trial', options.trial.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  return calFetch<{ data: CalibrationRaw[]; pagination: { total: number; limit: number; offset: number } }>(
    `/data/${session}?${params.toString()}`
  );
};

/** Get per-trial statistics */
export const getStatistics = (session?: string) => {
  const params = session ? `?session=${session}` : '';
  return calFetch<{ data: CalibrationStatistic[] }>(`/statistics${params}`);
};

/** Get per-session aggregate statistics */
export const getSessionStats = () =>
  calFetch<{ data: CalibrationSessionStat[] }>('/session-stats');

// Types
export interface CalibrationDeviceStatus {
  id: number;
  session: string;
  recording: boolean;
  trial: number;
  uptime_sec: number;
  wifi_rssi: number;
  free_heap: number;
  offline_buf: number;
  device_id: string;
  created_at: string;
}

export interface CalibrationRaw {
  id: number;
  session: string;
  trial: number;
  ts_device: number;
  ts_human: string | null;
  ts_iso: string | null;
  delta_g: number;
  marker: string | null;
  note: string | null;
  device_id: string;
  created_at: string;
}

export interface CalibrationStatistic {
  session: string;
  trial: number;
  n_samples: number;
  dg_min: number;
  dg_max: number;
  dg_mean: number;
  dg_stddev: number;
}

export interface CalibrationSessionStat {
  session: string;
  total_samples: number;
  n_trials: number;
  dg_min: number;
  dg_max: number;
  dg_mean: number;
  dg_stddev: number;
  dg_median: number;
  dg_p95: number;
  dg_p99: number;
}
