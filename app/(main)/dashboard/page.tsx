// frontend/app/(main)/dashboard/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { createClient } from '@/lib/supabase/client';
import {
  getWarehouses,
  getWarehouseDetails,
  getActiveAlerts,
  ActiveAlert
} from '@/lib/api';
import { useApiSWR } from '@/hooks/use-swr-api';
import WarehouseCard from '@/components/shared/WarehouseCard'; // <-- Import WarehouseCard sebagai default
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WarehouseSummaryStats } from '@/components/dashboard/WarehouseSummaryStats';
import { Wifi, WifiOff, TriangleAlert } from 'lucide-react'; // <-- Import ikon baru

// Komponen kartu Area (DIPERBARUI SECARA SIGNIFIKAN)
const AreaCard = ({
  area,
  warehouseId,
  alerts
}: {
  area: any;
  warehouseId: string;
  alerts: Set<string>;
}) => (
  <Card className="border-2 border-border shadow-shadow transition-all h-full flex flex-col">
    <CardHeader>
      <CardTitle>{area.name}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-2 flex-grow">
      <h4 className="font-semibold text-sm">Sistem Aktif:</h4>
      {area.active_systems.length > 0 ? (
        area.active_systems.map((system: any) => {
          // Cek apakah sistem ini memiliki peringatan aktif
          const hasAlert = alerts.has(`${area.id}-${system.system_type}`);
          // Use the status returned directly from the API
          const isOnline = system.status === 'Online';
          const isOffline = !isOnline;

          return (
            <Button
              asChild
              key={system.system_type}
              variant={
                hasAlert
                  ? 'alert' // 🔴 Red with pulse animation
                  : isOffline
                    ? 'muted' // ⚪ Grey for offline
                    : 'default' // 🟢 Primary color for online
              }
              className="w-full justify-center items-center"
            >
              <Link
                href={`/${warehouseId}/${area.id}/${system.system_type}`}
                className="flex justify-center items-center w-full"
              >
                {/* Pilih ikon berdasarkan prioritas: Alert > Offline > Online */}
                {hasAlert ? (
                  <TriangleAlert className="mr-2 h-4 w-4" />
                ) : isOffline ? (
                  <WifiOff className="mr-2 h-4 w-4" />
                ) : (
                  <Wifi className="mr-2 h-4 w-4 text-green-500" />
                )}
                <span className="capitalize">{system.system_type}</span>
              </Link>
            </Button>
          );
        })
      ) : (
        <p className="text-sm text-gray-500 italic">Tidak ada sistem aktif.</p>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { selectedWarehouse, setSelectedWarehouse } = useWarehouse();

  // SWR: fetch all warehouses when 'all' is selected
  const allWarehousesFetcher = React.useCallback(
    (token: string) => getWarehouses(token),
    []
  );
  const {
    data: warehouses,
    error: allError,
    isLoading: allLoading
  } = useApiSWR(
    selectedWarehouse === 'all' || !selectedWarehouse ? 'dashboard-all' : null,
    allWarehousesFetcher
  );

  // SWR: fetch single warehouse details + alerts when a specific warehouse is selected
  const singleFetcher = React.useCallback(
    async (token: string) => {
      const [details, alerts] = await Promise.all([
        getWarehouseDetails(selectedWarehouse!, token),
        getActiveAlerts(selectedWarehouse!, token)
      ]);
      return { details, alerts };
    },
    [selectedWarehouse]
  );
  const {
    data: singleData,
    error: singleError,
    isLoading: singleLoading,
    mutate: mutateSingle
  } = useApiSWR(
    selectedWarehouse && selectedWarehouse !== 'all'
      ? ['dashboard-single', selectedWarehouse]
      : null,
    singleFetcher
  );

  const loading = allLoading || singleLoading;
  const error = allError || singleError;

  // Build unified data shape for rendering
  const data = React.useMemo(() => {
    if (selectedWarehouse === 'all' || !selectedWarehouse) {
      return warehouses ? { type: 'all' as const, warehouses } : null;
    }
    return singleData
      ? {
          type: 'single' as const,
          details: singleData.details,
          alerts: singleData.alerts
        }
      : null;
  }, [selectedWarehouse, warehouses, singleData]);

  // --- EFEK BARU UNTUK REAL-TIME SUBSCRIPTION ---
  React.useEffect(() => {
    const supabase = createClient();
    let debounceTimer: NodeJS.Timeout;
    const handleDbChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        mutateSingle(); // SWR revalidation
      }, 500);
    };

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        handleDbChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'areas' },
        handleDbChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutateSingle]);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'Gagal memuat data dashboard.'}
          </p>
          <Button variant="neutral" onClick={() => setSelectedWarehouse('all')}>
            Kembali ke Semua Gudang
          </Button>
        </div>
      </div>
    );
  }

  // Buat lookup Set untuk pengecekan alert yang efisien
  const alertSet: Set<string> = new Set(
    data?.alerts?.map(
      (alert: ActiveAlert) => `${alert.area_id}-${alert.system_type}`
    ) || []
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {data?.type === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.warehouses && data.warehouses.length > 0 ? (
            data.warehouses.map((warehouse: any) => (
              <div
                key={warehouse.id}
                onClick={() => setSelectedWarehouse(warehouse.id)}
                className="cursor-pointer"
              >
                <WarehouseCard
                  id={warehouse.id}
                  name={warehouse.name || 'Unnamed Warehouse'}
                  location={warehouse.location}
                  // === PERBAIKAN DI SINI ===
                  // Akses properti langsung dari objek warehouse
                  areaCount={parseInt(warehouse.areaCount, 10) || 0}
                  deviceCount={parseInt(warehouse.deviceCount, 10) || 0}
                  onlineDeviceCount={
                    parseInt(warehouse.onlineDeviceCount, 10) || 0
                  }
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">Tidak ada gudang yang tersedia.</p>
            </div>
          )}
        </div>
      )}

      {data?.type === 'single' && data.details && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">{data.details.name}</h2>

          {/* Warehouse Summary Stats */}
          <div className="mb-6">
            <WarehouseSummaryStats details={data.details} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.details.areas.map((area: any) => (
              // Teruskan data peringatan ke AreaCard
              <AreaCard
                key={area.id}
                area={area}
                warehouseId={data.details.id}
                alerts={alertSet}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
