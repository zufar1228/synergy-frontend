/**
 * @file useCalibrationSSE.ts
 * @purpose Hook for SSE connection to calibration device status stream
 * @usedBy CalibrationPage, CalibrationStatusDisplay
 * @deps EventSource API, lib/env
 * @exports useCalibrationSSE
 * @sideEffects SSE connection lifecycle management
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { env } from '@/lib/env';
import {
  getDeviceStatus,
  type CalibrationDeviceStatus
} from '../api/calibration';

const SSE_URL = env.NEXT_PUBLIC_API_URL + '/api-cal/events';

/** Polling fallback interval when SSE is disconnected */
const FALLBACK_POLL_MS = 3000;

export interface CalibrationSSEState {
  /** Current calibration state from firmware (IDLE, COUNTDOWN, CALIBRATING, RECORDING, PAUSED) */
  calState: string;
  /** Full device status object (from SSE or polling fallback) */
  status: CalibrationDeviceStatus | null;
  /** Whether the SSE connection is active */
  connected: boolean;
}

/**
 * Hook that provides realtime calibration device state via SSE.
 * Falls back to HTTP polling if SSE connection fails.
 */
export function useCalibrationSSE(deviceId: string): CalibrationSSEState {
  const [calState, setCalState] = useState('IDLE');
  const [status, setStatus] = useState<CalibrationDeviceStatus | null>(null);
  const [connected, setConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling fallback — used when SSE is disconnected
  const startFallbackPolling = useCallback(() => {
    if (fallbackTimerRef.current) return; // already running
    const poll = async () => {
      try {
        const result = await getDeviceStatus(deviceId);
        if (result.data) {
          setStatus(result.data);
          setCalState(result.data.cal_state || (result.data.recording ? 'RECORDING' : 'IDLE'));
        }
      } catch {
        // ignore poll errors
      }
    };
    poll();
    fallbackTimerRef.current = setInterval(poll, FALLBACK_POLL_MS);
  }, [deviceId]);

  const stopFallbackPolling = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!deviceId) return;

    const connect = () => {
      const es = new EventSource(`${SSE_URL}/${deviceId}`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        stopFallbackPolling();
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Map MQTT event fields to CalibrationDeviceStatus shape
          const mappedStatus: CalibrationDeviceStatus = {
            id: data.id ?? 0,
            session: data.session ?? 'none',
            recording: data.cal_state === 'RECORDING' || data.recording === true,
            cal_state: data.cal_state ?? (data.recording ? 'RECORDING' : 'IDLE'),
            trial: data.trial ?? 0,
            uptime_sec: data.uptime_sec ?? 0,
            wifi_rssi: data.wifi_rssi ?? 0,
            free_heap: data.free_heap ?? 0,
            offline_buf: data.offline_buf ?? 0,
            door_state: data.door_state ?? data.door ?? null,
            device_id: data.device_id ?? deviceId,
            created_at: data.created_at ?? data.ts ?? new Date().toISOString()
          };

          setStatus(mappedStatus);
          setCalState(mappedStatus.cal_state);
        } catch {
          // ignore malformed SSE data
        }
      };

      es.onerror = () => {
        setConnected(false);
        // EventSource will auto-reconnect. Start fallback polling until it does.
        startFallbackPolling();
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      stopFallbackPolling();
    };
  }, [deviceId, startFallbackPolling, stopFallbackPolling]);

  return { calState, status, connected };
}
