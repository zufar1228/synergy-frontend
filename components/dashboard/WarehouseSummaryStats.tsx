// frontend/components/dashboard/WarehouseSummaryStats.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, HardDrive, Wifi, WifiOff } from "lucide-react";

export const WarehouseSummaryStats = ({ details }: { details: any }) => {
  const offlineCount = details.deviceCount - details.onlineDeviceCount;

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building className="h-4 w-4" /> Total Area
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{details.areaCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Total Perangkat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{details.deviceCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Status Perangkat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold">
              {details.onlineDeviceCount}
            </span>
            <span className="text-sm text-muted-foreground">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-red-600" />
            <span className="text-2xl font-bold">{offlineCount}</span>
            <span className="text-sm text-muted-foreground">Offline</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
