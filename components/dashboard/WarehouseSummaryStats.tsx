// frontend/components/dashboard/WarehouseSummaryStats.tsx
'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Building, HardDrive, Wifi, WifiOff } from 'lucide-react';

export const WarehouseSummaryStats = ({ details }: { details: any }) => {
  const offlineCount = details.deviceCount - details.onlineDeviceCount;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6 md:mb-8">
      <Card className="overflow-hidden">
        <CardContent className="flex items-center gap-3 sm:gap-4 py-4 sm:py-5 px-4 sm:px-6">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-base bg-main/15 border-2 border-border">
            <Building className="h-5 w-5 sm:h-6 sm:w-6 text-main" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Total Area
            </p>
            <p className="text-2xl sm:text-3xl font-bold leading-none mt-1">
              {details.areaCount}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="flex items-center gap-3 sm:gap-4 py-4 sm:py-5 px-4 sm:px-6">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-base bg-chart-5/15 border-2 border-border">
            <HardDrive className="h-5 w-5 sm:h-6 sm:w-6 text-chart-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Total Perangkat
            </p>
            <p className="text-2xl sm:text-3xl font-bold leading-none mt-1">
              {details.deviceCount}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden sm:col-span-2 md:col-span-1">
        <CardContent className="flex items-center gap-3 sm:gap-4 py-4 sm:py-5 px-4 sm:px-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-2 sm:mb-3">
              Status Perangkat
            </p>
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
                </div>
                <span className="text-xl sm:text-2xl font-bold">
                  {details.onlineDeviceCount}
                </span>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
              <div className="h-6 sm:h-8 w-0.5 bg-border" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                <span className="text-xl sm:text-2xl font-bold">
                  {offlineCount}
                </span>
                <span className="text-xs text-muted-foreground">Offline</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
