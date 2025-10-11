// frontend/components/shared/WarehouseCard.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Wifi } from "lucide-react"; // <-- Tambahkan ikon

// Perbarui props
interface WarehouseCardProps {
  id: string;
  name: string;
  location: string | null;
  areaCount: number;
  deviceCount: number;
  onlineDeviceCount: number;
}

// Tipe untuk status dinamis
type Status = "Operational" | "Warning" | "Critical" | "Empty";

const WarehouseCard = ({
  name,
  location,
  areaCount,
  deviceCount,
  onlineDeviceCount,
}: WarehouseCardProps) => {
  let overall_status: Status = "Operational";
  let statusText = "Semua perangkat online";

  if (deviceCount === 0) {
    overall_status = "Empty";
    statusText = "Belum ada perangkat";
  } else if (onlineDeviceCount < deviceCount) {
    overall_status = "Warning";
    statusText = `${deviceCount - onlineDeviceCount} perangkat offline`;
  }

  const statusConfig: { [key in Status]: { color: string; text: string } } = {
    Operational: {
      color: "bg-green-500 hover:bg-green-600",
      text: "Operational",
    },
    Warning: { color: "bg-yellow-500 hover:bg-yellow-600", text: "Warning" },
    Critical: { color: "bg-red-500 hover:bg-red-600", text: "Critical" },
    Empty: { color: "bg-gray-400 hover:bg-gray-500", text: "Empty" },
  };

  return (
    <Card className="border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {name}
            </CardTitle>
            {location && (
              <CardDescription className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" />
                {location}
              </CardDescription>
            )}
          </div>
          <Badge className={statusConfig[overall_status].color}>
            {statusConfig[overall_status].text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <div className="text-sm text-muted-foreground mb-2">{statusText}</div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Area</span>
            <span className="font-medium">{areaCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Perangkat</span>
            <span className="font-medium">{deviceCount}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Perangkat Online</span>
            <div className="flex items-center gap-1">
              <Wifi className="h-4 w-4 text-green-600" />
              <span>{onlineDeviceCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarehouseCard; // Pastikan ada default export jika belum
