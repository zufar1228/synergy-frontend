"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { DateRangePicker } from "@/components/date-range-picker";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Thermometer,
  Droplets,
  Vibrate,
  MoreVertical,
  CheckCircle,
} from "lucide-react";
import { subDays } from "date-fns";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Types
interface ProteksiAsetLog {
  id: string;
  device_id: string;
  incident_type: "IMPACT" | "VIBRATION" | "THERMAL" | "WATER_LEAK" | "NORMAL";
  confidence: number | null;
  data: {
    raw_values?: {
      accX?: number;
      accY?: number;
      accZ?: number;
      gyroX?: number;
      gyroY?: number;
      gyroZ?: number;
      mic_level?: number;
      thermal_avg?: number;
      thermal_max?: number;
      water_level?: number;
    };
  };
  is_cleared: boolean;
  timestamp: string;
}

interface Summary {
  totalIncidents: number;
  activeIncidents: number;
}

interface ChartData {
  time: string;
  vibration: number;
  sound: number;
}

interface ProteksiAsetViewProps {
  areaId?: string;
  deviceId?: string;
  initialData?: {
    logs: ProteksiAsetLog[];
    summary: Summary;
    chartData: ChartData[];
  };
}

const chartConfig = {
  vibration: {
    label: "Getaran (g)",
    color: "var(--chart-4)",
  },
  sound: {
    label: "Suara (level)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export const ProteksiAsetView = ({ areaId, initialData }: ProteksiAsetViewProps) => {
  const [logs, setLogs] = useState<ProteksiAsetLog[]>(initialData?.logs || []);
  const [summary, setSummary] = useState<Summary>(
    initialData?.summary || { totalIncidents: 0, activeIncidents: 0 }
  );
  const [chartData, setChartData] = useState<ChartData[]>(initialData?.chartData || []);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const supabase = createClient();

  // Get date range from URL params
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Fetch logs based on date range
  const fetchLogs = useCallback(async () => {
    const from = fromParam ? new Date(fromParam) : subDays(new Date(), 7);
    const to = toParam ? new Date(toParam) : new Date();

    setIsLoading(true);
    try {
      // Get devices in this area first
      const { data: devices } = await supabase
        .from("devices")
        .select("id")
        .eq("area_id", areaId)
        .eq("system_type", "proteksi_aset");

      if (!devices || devices.length === 0) {
        setLogs([]);
        setSummary({ totalIncidents: 0, activeIncidents: 0 });
        setChartData([]);
        return;
      }

      const deviceIds = devices.map((d) => d.id);

      const { data, error } = await supabase
        .from("proteksi_aset_logs")
        .select("*")
        .in("device_id", deviceIds)
        .gte("timestamp", from.toISOString())
        .lte("timestamp", to.toISOString())
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[ProteksiAsetView] Error fetching logs:", error);
        return;
      }

      if (data) {
        setLogs(data as ProteksiAsetLog[]);

        // Calculate summary
        const activeCount = data.filter((l) => !l.is_cleared && l.incident_type !== "NORMAL").length;
        setSummary({
          totalIncidents: data.length,
          activeIncidents: activeCount,
        });

        // Build chart data (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const chartPoints = data
          .filter((l) => new Date(l.timestamp) >= oneDayAgo)
          .map((l) => ({
            time: l.timestamp,
            vibration: l.data?.raw_values?.accX || 0,
            sound: l.data?.raw_values?.mic_level || 0,
          }))
          .reverse();
        setChartData(chartPoints);
      }
    } finally {
      setIsLoading(false);
    }
  }, [areaId, fromParam, toParam, supabase]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("proteksi-aset-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proteksi_aset_logs" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newLog = payload.new as ProteksiAsetLog;
            setLogs((current) => [newLog, ...current]);
            
            // Update summary
            setSummary((current) => ({
              totalIncidents: current.totalIncidents + 1,
              activeIncidents: newLog.is_cleared ? current.activeIncidents : current.activeIncidents + 1,
            }));

            // Update chart
            const newPoint: ChartData = {
              time: newLog.timestamp,
              vibration: newLog.data?.raw_values?.accX || 0,
              sound: newLog.data?.raw_values?.mic_level || 0,
            };
            setChartData((current) => [...current, newPoint]);
          }

          if (payload.eventType === "UPDATE") {
            const updatedLog = payload.new as ProteksiAsetLog;
            const oldLog = payload.old as ProteksiAsetLog;
            
            setLogs((current) =>
              current.map((log) =>
                String(log.id) === String(updatedLog.id) ? updatedLog : log
              )
            );

            // Update summary if cleared
            if (updatedLog.is_cleared && !oldLog.is_cleared) {
              setSummary((current) => ({
                ...current,
                activeIncidents: Math.max(0, current.activeIncidents - 1),
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Clear incident handler
  const handleClearIncident = async (incidentId: string) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        toast.error("Sesi tidak valid");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/proteksi-aset/${incidentId}/clear`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to clear incident");
      }

      toast.success("Insiden berhasil di-clear");
    } catch (error) {
      console.error("Error clearing incident:", error);
      toast.error("Gagal meng-clear insiden");
    }
  };

  // Helper functions
  const getIncidentIcon = (type: string) => {
    switch (type) {
      case "IMPACT":
        return <Vibrate className="h-4 w-4" />;
      case "VIBRATION":
        return <Vibrate className="h-4 w-4" />;
      case "THERMAL":
        return <Thermometer className="h-4 w-4" />;
      case "WATER_LEAK":
        return <Droplets className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getIncidentBadgeClass = (type: string, isCleared: boolean): string => {
    if (isCleared) return "bg-gray-500 text-white";
    
    switch (type) {
      case "IMPACT":
        return "bg-red-500 text-white";
      case "WATER_LEAK":
        return "bg-red-500 text-white";
      case "VIBRATION":
        return "bg-yellow-500 text-black";
      case "THERMAL":
        return "bg-orange-500 text-white";
      default:
        return "bg-green-500 text-white";
    }
  };

  const getIncidentLabel = (type: string): string => {
    const labels: Record<string, string> = {
      IMPACT: "Benturan",
      VIBRATION: "Getaran",
      THERMAL: "Suhu Tinggi",
      WATER_LEAK: "Kebocoran Air",
      NORMAL: "Normal",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Proteksi Aset
          </h2>
          <p className="text-muted-foreground">
            Monitoring ML untuk deteksi getaran, suhu, dan kebocoran air
          </p>
        </div>
        <DateRangePicker />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Insiden</CardDescription>
              <ShieldCheck className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{summary.totalIncidents}</span>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Insiden Aktif</CardDescription>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-red-500">
              {summary.activeIncidents}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Insiden (24 Jam Terakhir)</CardTitle>
          <CardDescription>
            Menampilkan data getaran dan suara dari insiden yang tercatat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              <YAxis />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area
                dataKey="vibration"
                type="natural"
                fill="var(--color-vibration)"
                fillOpacity={0.4}
                stroke="var(--color-vibration)"
              />
              <Area
                dataKey="sound"
                type="natural"
                fill="var(--color-sound)"
                fillOpacity={0.4}
                stroke="var(--color-sound)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Insiden</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-muted-foreground">Memuat...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <ShieldCheck className="h-12 w-12 mb-2 opacity-50" />
                <p>Tidak ada insiden dalam rentang waktu ini.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Tipe Insiden</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.timestamp), "dd MMM yyyy HH:mm:ss", {
                          locale: localeID,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getIncidentBadgeClass(log.incident_type, log.is_cleared)}>
                          <span className="flex items-center gap-1">
                            {getIncidentIcon(log.incident_type)}
                            {getIncidentLabel(log.incident_type)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.confidence ? `${(log.confidence * 100).toFixed(1)}%` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.is_cleared ? "neutral" : "default"}>
                          {log.is_cleared ? "Cleared" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="neutral" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={log.is_cleared}
                              onClick={() => handleClearIncident(log.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Clear Insiden
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProteksiAsetView;
