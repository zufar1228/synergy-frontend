"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, ShieldAlert, Activity, Radio } from "lucide-react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

type IntrusiEventClass = "Normal" | "Disturbance" | "Intrusion";

interface IntrusiLog {
  id: string;
  device_id: string;
  event_class: IntrusiEventClass;
  confidence: number;
  payload: object | null;
  timestamp: string;
}

type SecurityStatus = "AMAN" | "GANGGUAN" | "BAHAYA";

interface IntrusiMonitorProps {
  deviceId: string;
}

export const IntrusiMonitor = ({ deviceId }: IntrusiMonitorProps) => {
  const [logs, setLogs] = useState<IntrusiLog[]>([]);
  const [status, setStatus] = useState<SecurityStatus>("AMAN");
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  // Helper: Tentukan status saat ini berdasarkan log terakhir
  const updateCurrentStatus = (latestLog: IntrusiLog | null) => {
    if (!latestLog) {
      setStatus("AMAN");
      return;
    }

    // Jika event terakhir adalah Intrusi dan terjadi < 5 menit yang lalu -> BAHAYA
    const isRecent =
      new Date().getTime() - new Date(latestLog.timestamp).getTime() <
      5 * 60 * 1000;

    if (latestLog.event_class === "Intrusion" && isRecent) {
      setStatus("BAHAYA");
    } else if (latestLog.event_class === "Disturbance" && isRecent) {
      setStatus("GANGGUAN");
    } else {
      setStatus("AMAN");
    }
  };

  // 1. Fetch Data Awal
  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("intrusi_logs")
        .select("*")
        .eq("device_id", deviceId)
        .order("timestamp", { ascending: false })
        .limit(10);

      if (error) {
        console.error("[IntrusiMonitor] Error fetching logs:", error);
        return;
      }

      if (data) {
        setLogs(data as IntrusiLog[]);
        updateCurrentStatus(data[0] as IntrusiLog | null);
      }
    };

    fetchLogs();
  }, [deviceId]);

  // 2. Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel(`intrusi-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "intrusi_logs",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          console.log("[IntrusiMonitor] New event:", payload.new);
          const newLog = payload.new as IntrusiLog;
          setLogs((prev) => [newLog, ...prev].slice(0, 10)); // Keep top 10
          updateCurrentStatus(newLog);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        console.log("[IntrusiMonitor] Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  // Auto-refresh status (check if status should go back to AMAN after 5 mins)
  useEffect(() => {
    const interval = setInterval(() => {
      if (logs.length > 0) {
        updateCurrentStatus(logs[0]);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [logs]);

  const getEventClassName = (eventClass: IntrusiEventClass): string => {
    switch (eventClass) {
      case "Intrusion":
        return "bg-red-500 text-white border-red-600";
      case "Disturbance":
        return "bg-yellow-500 text-black border-yellow-600";
      default:
        return "bg-green-500 text-white border-green-600";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Deteksi Intrusi (TinyML)
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Connection Indicator */}
            <div
              className={`flex items-center gap-1 text-xs ${
                isConnected ? "text-green-500" : "text-gray-400"
              }`}
            >
              <Radio className="h-3 w-3" />
              {isConnected ? "Live" : "Connecting..."}
            </div>

            {/* Status Badge */}
            {status === "AMAN" && (
              <Badge className="bg-green-500 hover:bg-green-600">
                <ShieldCheck className="w-3 h-3 mr-1" /> AMAN
              </Badge>
            )}
            {status === "GANGGUAN" && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                GANGGUAN
              </Badge>
            )}
            {status === "BAHAYA" && (
              <Badge className="bg-red-600 hover:bg-red-700 animate-pulse">
                <ShieldAlert className="w-3 h-3 mr-1" /> INTRUSI!
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Monitoring getaran & suara real-time berbasis AI (Edge Computing).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
          Riwayat Deteksi Terkini
        </h4>
        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
          {logs.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
              Belum ada aktivitas terdeteksi.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Badge className={getEventClassName(log.event_class)}>
                        {log.event_class.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      Confidence: {(log.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {format(new Date(log.timestamp), "HH:mm:ss", {
                      locale: localeID,
                    })}
                    <br />
                    {format(new Date(log.timestamp), "dd MMM yyyy", {
                      locale: localeID,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default IntrusiMonitor;
