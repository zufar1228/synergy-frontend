"use client";
import React, { useState } from "react";
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
  const [clicked, setClicked] = useState(false);
  let overall_status: Status = "Operational";
  let statusText = "Semua perangkat online";

  if (deviceCount === 0) {
    overall_status = "Empty";
    statusText = "Belum ada perangkat";
  } else if (onlineDeviceCount < deviceCount) {
    overall_status = "Warning";
    statusText = `${deviceCount - onlineDeviceCount} perangkat offline`;
  }

  const statusConfig: { [key in Status]: { variant: "success" | "warning" | "destructive" | "neutral"; text: string } } = {
    Operational: {
      variant: "success",
      text: "Operational",
    },
    Warning: { variant: "warning", text: "Warning" },
    Critical: { variant: "destructive", text: "Critical" },
    Empty: { variant: "neutral", text: "Empty" },
  };

  return (
    <Card 
      onClick={() => {
        setClicked(true);
        setTimeout(() => setClicked(false), 300);
      }}
      data-clicked={clicked}
      className="border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all h-full flex flex-col data-[clicked=true]:!translate-x-boxShadowX data-[clicked=true]:!translate-y-boxShadowY data-[clicked=true]:!shadow-none data-[clicked=true]:md:!translate-x-0 data-[clicked=true]:md:!translate-y-0 data-[clicked=true]:md:!shadow-shadow"
    >
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
          <Badge variant={statusConfig[overall_status].variant as any}>
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
