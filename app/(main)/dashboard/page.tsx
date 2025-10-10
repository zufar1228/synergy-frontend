// frontend/app/(main)/dashboard/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getWarehouses, getWarehouseDetails, Warehouse } from "@/lib/api"; // getWarehouseDetails adalah alias untuk /areas-with-systems
import { WarehouseCard } from "@/components/shared/WarehouseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Komponen kartu Area (DIPERBARUI)
const AreaCard = ({
  area,
  warehouseId,
}: {
  area: any;
  warehouseId: string;
}) => (
  <Card className="border-2 border-border shadow-shadow transition-all h-full flex flex-col">
    <CardHeader>
      <CardTitle>{area.name}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      <h4 className="font-semibold text-sm">Sistem Aktif:</h4>
      {/* Hover effect utama ada di kartu, 
        tapi kita tetap pertahankan hover di link untuk feedback tambahan 
      */}
      {area.active_systems.length > 0 ? (
        area.active_systems.map((system: any) => (
          <Button asChild key={system.system_type}>
            <Link href={`/${warehouseId}/${area.id}/${system.system_type}`}>
              <span className="capitalize">{system.system_type}</span>
            </Link>
          </Button>
        ))
      ) : (
        <p className="text-sm text-gray-500 italic">Tidak ada sistem aktif.</p>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { selectedWarehouse, setSelectedWarehouse } = useWarehouse();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      try {
        if (selectedWarehouse === "all" || !selectedWarehouse) {
          const warehouses = await getWarehouses(session.access_token);
          setData({ type: "all", warehouses });
        } else {
          const warehouseDetails = await getWarehouseDetails(
            selectedWarehouse,
            session.access_token
          );
          setData({ type: "single", details: warehouseDetails });
        }
      } catch (error) {
        toast.error("Gagal memuat data dashboard.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedWarehouse]); // <-- Efek ini akan berjalan lagi setiap kali pilihan gudang berubah

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {data?.type === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.warehouses.map((warehouse: Warehouse) => (
            <div
              key={warehouse.id}
              onClick={() => setSelectedWarehouse(warehouse.id)}
              className="cursor-pointer"
            >
              <WarehouseCard
                id={warehouse.id}
                name={warehouse.name}
                location={warehouse.location}
                areaCount={0}
                deviceCount={0}
                overall_status="Operational" // Data dummy
              />
            </div>
          ))}
        </div>
      )}

      {data?.type === "single" && data.details && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">{data.details.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.details.areas.map((area: any) => (
              <AreaCard
                key={area.id}
                area={area}
                warehouseId={data.details.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
