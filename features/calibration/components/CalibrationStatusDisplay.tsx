'use client';

import { useState, useEffect } from 'react';
import {
  getDeviceStatus,
  type CalibrationDeviceStatus
} from '../api/calibration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  deviceId: string;
  /** Realtime status from SSE hook (takes priority over polling) */
  sseStatus?: CalibrationDeviceStatus | null;
  /** Whether SSE is connected (disables polling when true) */
  sseConnected?: boolean;
}

export default function CalibrationStatusDisplay({
  deviceId,
  sseStatus,
  sseConnected
}: Props) {
  const [polledStatus, setPolledStatus] = useState<CalibrationDeviceStatus | null>(null);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Use SSE data when available, fall back to polled data
  const status = sseStatus ?? polledStatus;

  // Update lastRefresh timestamp when SSE data arrives
  useEffect(() => {
    if (sseStatus) {
      setLastRefresh(new Date());
    }
  }, [sseStatus]);

  // Fallback: poll every 5 seconds only when SSE is disconnected
  useEffect(() => {
    if (sseConnected || !deviceId) return;

    const fetchStatus = async () => {
      try {
        const result = await getDeviceStatus(deviceId);
        setPolledStatus(result.data);
        setError('');
        setLastRefresh(new Date());
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [deviceId, sseConnected]);

  if (!deviceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Enter a Device ID to see status
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-base flex items-center justify-between">
          Device Status
          {lastRefresh && (
            <span className="text-xs font-normal text-muted-foreground">
              Updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {!status ? (
          <p className="text-muted-foreground">No status data available yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <StatusItem
              label="State"
              value={
                <Badge
                  variant={
                    status.cal_state === 'RECORDING'
                      ? 'default'
                      : status.cal_state === 'COUNTDOWN' ||
                          status.cal_state === 'CALIBRATING'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {status.cal_state ||
                    (status.recording ? 'RECORDING' : 'IDLE')}
                </Badge>
              }
            />
            <StatusItem label="Session" value={status.session || 'none'} />
            <StatusItem label="Trial" value={`#${status.trial}`} />
            <StatusItem
              label="Door"
              value={
                <Badge
                  variant={
                    status.door_state === 'CLOSED'
                      ? 'success'
                      : status.door_state === 'OPEN'
                        ? 'destructive'
                        : 'neutral'
                  }
                >
                  {status.door_state === 'CLOSED'
                    ? '🔒 CLOSED'
                    : status.door_state === 'OPEN'
                      ? '🔓 OPEN'
                      : 'Unknown'}
                </Badge>
              }
            />
            <StatusItem label="WiFi RSSI" value={`${status.wifi_rssi} dBm`} />
            <StatusItem
              label="Uptime"
              value={formatUptime(status.uptime_sec)}
            />
            <StatusItem
              label="Free Heap"
              value={`${(status.free_heap / 1024).toFixed(0)} KB`}
            />
            <StatusItem
              label="Last Seen"
              value={new Date(status.created_at).toLocaleTimeString()}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusItem({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
