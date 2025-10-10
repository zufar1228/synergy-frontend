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
import { Building2, MapPin } from "lucide-react";

// Definisikan tipe data untuk props
// Untuk saat ini, overall_status adalah string statis
// Nanti kita akan membuatnya dinamis berdasarkan data real-time
interface WarehouseCardProps {
  id: string;
  name: string;
  location: string | null;
  areaCount: number;
  deviceCount: number;
  overall_status: "Operational" | "Warning" | "Critical";
}

// Logika untuk warna badge berdasarkan status
const statusColors: { [key in WarehouseCardProps["overall_status"]]: string } =
  {
    Operational: "bg-green-500 hover:bg-green-600 text-white",
    Warning: "bg-yellow-500 hover:bg-yellow-600 text-black",
    Critical: "bg-red-500 hover:bg-red-600 text-white",
  };

export const WarehouseCard = ({
  name,
  location,
  areaCount,
  deviceCount,
  overall_status,
}: WarehouseCardProps) => {
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
          <Badge className={statusColors[overall_status]}>
            {overall_status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm">
          <div className="text-muted-foreground">Total Area</div>
          <div className="font-medium">{areaCount}</div>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <div className="text-muted-foreground">Total Perangkat</div>
          <div className="font-medium">{deviceCount}</div>
        </div>
      </CardContent>
    </Card>
  );
};
