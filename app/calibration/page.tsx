'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import CalibrationControlPanel from '@/features/calibration/components/CalibrationControlPanel';
import CalibrationStatusDisplay from '@/features/calibration/components/CalibrationStatusDisplay';
import CalibrationDataTable from '@/features/calibration/components/CalibrationDataTable';

const DEFAULT_DEVICE_ID = '8e819e4a-9710-491f-9fbc-741892ae6195';

export default function CalibrationPage() {
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE_ID);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen overflow-y-auto container mx-auto px-3 py-4 space-y-4 max-w-5xl sm:px-4 sm:space-y-6 pb-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Calibration Control</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Remote control — Sessions A (ambient), B (impact), C (chisel), D (ram)
        </p>
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
          onCommandSent={() => setRefreshTrigger((t) => t + 1)}
        />
        <CalibrationStatusDisplay
          deviceId={deviceId}
          refreshTrigger={refreshTrigger}
        />
      </div>

      <CalibrationDataTable />
    </div>
  );
}
