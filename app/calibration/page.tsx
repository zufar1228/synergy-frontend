'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CalibrationControlPanel from '@/features/calibration/components/CalibrationControlPanel';
import CalibrationStatusDisplay from '@/features/calibration/components/CalibrationStatusDisplay';
import CalibrationDataTable from '@/features/calibration/components/CalibrationDataTable';
import { useCalibrationSSE } from '@/features/calibration/hooks/useCalibrationSSE';

const DEFAULT_DEVICE_ID = '8e819e4a-9710-491f-9fbc-741892ae6195';

export default function CalibrationPage() {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE_ID);
  const { calState, status: sseStatus, connected: sseConnected } = useCalibrationSSE(deviceId);

  return (
    <div className="h-screen overflow-y-auto container mx-auto px-3 py-4 space-y-4 max-w-5xl sm:px-4 sm:space-y-6 pb-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Calibration Control</h1>
        <div className="flex items-center gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Remote control — Sessions A (ambient), B (ramming), C (chisel)
          </p>
          <Badge variant={sseConnected ? 'success' : 'neutral'} className="text-[10px] h-5">
            {sseConnected ? '● Live' : '○ Polling'}
          </Badge>
        </div>
      </div>

      {/* Device ID (collapsible) */}
      <details className="text-sm">
        <summary className="font-medium cursor-pointer text-muted-foreground">
          Device: <span className="font-mono">{deviceId.slice(0, 8)}...</span>
        </summary>
        <Input
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="Enter device UUID"
          className="mt-2 max-w-lg font-mono text-sm"
        />
      </details>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] sm:gap-6">
        <CalibrationControlPanel
          deviceId={deviceId}
          calState={calState}
        />
        <CalibrationStatusDisplay
          deviceId={deviceId}
          sseStatus={sseStatus}
          sseConnected={sseConnected}
        />
      </div>

      <CalibrationDataTable />
    </div>
  );
}
