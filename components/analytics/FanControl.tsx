// frontend/components/analytics/FanControl.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getDeviceDetailsByArea,
  sendManualFanCommand,
  EnvironmentDeviceStatus,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Fan, Power, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const FanControl = ({
  areaId,
  isDeviceOnline,
}: {
  areaId: string;
  isDeviceOnline?: boolean;
}) => {
  const [device, setDevice] = useState<EnvironmentDeviceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingCmd, setIsSendingCmd] = useState(false);
  const supabase = createClient();

  // Fungsi untuk mengambil status terbaru
  const fetchStatus = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const status = await getDeviceDetailsByArea(
        session.access_token,
        areaId,
        "lingkungan"
      );
      setDevice(status);
    } catch (error) {
      toast.error("Gagal mengambil status kipas.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ambil status saat komponen dimuat
  useEffect(() => {
    fetchStatus();
  }, [areaId]);

  // Dengarkan perubahan real-time pada tabel 'devices'
  useEffect(() => {
    const channel = supabase
      .channel(`fan-status-${areaId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "devices",
          filter: `area_id=eq.${areaId}`,
        },
        (payload) => {
          console.log("Real-time: Status kipas berubah!", payload.new);
          // Update state dengan data baru dari payload
          setDevice((prev) =>
            prev
              ? {
                  ...prev,
                  fan_status: payload.new.fan_status,
                  status: payload.new.status,
                }
              : null
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, areaId]);

  // Handler untuk tombol manual
  const handleCommand = async (action: "On" | "Off") => {
    if (!device || !isDeviceOnline) return;
    setIsSendingCmd(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Sesi tidak valid.");
      setIsSendingCmd(false);
      return;
    }

    try {
      await sendManualFanCommand(session.access_token, device.id, action);
      toast.success(`Perintah manual '${action}' terkirim.`);
      // Kita tidak perlu set state manual, kita tunggu update real-time
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSendingCmd(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full md:w-1/3" />;
  }

  if (!device) {
    return (
      <Card className="w-full md:w-1/3">
        <CardContent>
          Perangkat lingkungan tidak ditemukan di area ini.
        </CardContent>
      </Card>
    );
  }

  const isFanOn = device?.fan_status === "On";
  const isDeviceOffline = !isDeviceOnline;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kontrol Kipas Manual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-4 rounded-lg bg-muted">
          <Fan
            className={cn(
              "h-16 w-16",
              isFanOn
                ? "text-primary animate-spin-slow"
                : "text-muted-foreground"
            )}
          />
        </div>

        {isDeviceOffline ? (
          <div className="flex items-center justify-center gap-2 text-red-500">
            <WifiOff className="h-5 w-5" />
            <span className="font-medium">Perangkat Offline</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              className="w-full"
              variant={isFanOn ? "default" : "reverse"}
              onClick={() => handleCommand("On")}
              disabled={isSendingCmd || !isDeviceOnline || isFanOn}
            >
              <Power className="mr-2 h-4 w-4" /> NYALAKAN
            </Button>
            <Button
              className="w-full"
              variant={!isFanOn ? "reverse" : "default"}
              onClick={() => handleCommand("Off")}
              disabled={isSendingCmd || !isDeviceOnline || !isFanOn}
            >
              <Power className="mr-2 h-4 w-4" /> MATIKAN
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
