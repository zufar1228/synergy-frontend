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
    <div className="container mx-auto p-4 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">MPU6050 Calibration Control</h1>
        <p className="text-muted-foreground">
          Remote control for vibration data collection — Sessions A (ambient), B (impact), C (chisel), D (ram)
        </p>
      </div>

      {/* Device ID Input */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Device ID</label>
        <Input
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="Enter device UUID"
          className="max-w-lg font-mono text-sm"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
