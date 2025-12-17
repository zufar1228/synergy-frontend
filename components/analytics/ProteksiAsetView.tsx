"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { DateRangePicker } from "@/components/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  Droplets,
  Clock,
  Calendar,
  Thermometer,
  Settings2,
  Activity,
  Camera,
  Zap,
  CheckCircle,
  Shield,
} from "lucide-react";
import { subDays, format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { useSearchParams } from "next/navigation";

interface ChartData {
  time: string;
  timestamp: number;
  value: number;
  raw: number;
}

type TimeRange = "Realtime" | "1m" | "1h" | "1d" | "1w" | "1mo" | "1y";

interface ProteksiAsetLog {
  id: string;
  device_id: string;
  incident_type: "IMPACT" | "VIBRATION" | "THERMAL" | "WATER_LEAK" | "NORMAL";
  confidence: number;
  data: {
    camera_image?: string;
    thermal_data?: number[];
    water_level?: number;
    water_raw?: number;
    temperature?: number;
    accelerometer?: { x: number; y: number; z: number };
  } | null;
  is_cleared: boolean;
  timestamp: string;
}

interface ProteksiAsetSummary {
  total_events: number;
  impacts: number;
  vibrations: number;
  thermals: number;
  water_leaks: number;
  normals: number;
}

interface ProteksiAsetViewProps {
  deviceId: string;
  initialData?: {
    logs: ProteksiAsetLog[];
    summary: ProteksiAsetSummary;
  };
}

export const ProteksiAsetView = ({
  deviceId,
  initialData,
}: ProteksiAsetViewProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [logs, setLogs] = useState<ProteksiAsetLog[]>(initialData?.logs || []);
  const [summary, setSummary] = useState<ProteksiAsetSummary>(
    initialData?.summary || {
      total_events: 0,
      impacts: 0,
      vibrations: 0,
      thermals: 0,
      water_leaks: 0,
      normals: 0,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Real-time data states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [thermalData, setThermalData] = useState<number[]>([]);
  const [thresholdInput, setThresholdInput] = useState<string>("35");
  const [isSaving, setIsSaving] = useState(false);

  // History & Filter states
  const [fullWaterHistory, setFullWaterHistory] = useState<ChartData[]>([]);
  const [fullTempHistory, setFullTempHistory] = useState<ChartData[]>([]);
  const [waterRange, setWaterRange] = useState<TimeRange>("Realtime");
  const [tempRange, setTempRange] = useState<TimeRange>("Realtime");

  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get date range from URL params
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Initialize
  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Load localStorage data
    if (typeof window !== "undefined") {
      const savedT = localStorage.getItem("proteksi_threshold");
      if (savedT) setThresholdInput(savedT);

      try {
        const w = localStorage.getItem("proteksi_water_history");
        if (w) {
          const parsed = JSON.parse(w);
          if (Array.isArray(parsed)) setFullWaterHistory(parsed);
        }
        const t = localStorage.getItem("proteksi_temp_history");
        if (t) {
          const parsed = JSON.parse(t);
          if (Array.isArray(parsed)) setFullTempHistory(parsed);
        }
      } catch (e) {
        console.error("Error loading history from localStorage:", e);
      }
    }

    return () => clearInterval(timer);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (isMounted && thresholdInput) {
      localStorage.setItem("proteksi_threshold", thresholdInput);
    }
  }, [thresholdInput, isMounted]);

  useEffect(() => {
    if (isMounted && fullWaterHistory.length > 0) {
      localStorage.setItem(
        "proteksi_water_history",
        JSON.stringify(fullWaterHistory.slice(-10000))
      );
    }
  }, [fullWaterHistory, isMounted]);

  useEffect(() => {
    if (isMounted && fullTempHistory.length > 0) {
      localStorage.setItem(
        "proteksi_temp_history",
        JSON.stringify(fullTempHistory.slice(-10000))
      );
    }
  }, [fullTempHistory, isMounted]);

  // Fetch logs from Supabase
  const fetchLogs = async () => {
    const from = fromParam ? new Date(fromParam) : subDays(new Date(), 7);
    const to = toParam ? new Date(toParam) : new Date();

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("proteksi_aset_logs")
        .select("*")
        .eq("device_id", deviceId)
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
        const impacts = data.filter((l) => l.incident_type === "IMPACT").length;
        const vibrations = data.filter((l) => l.incident_type === "VIBRATION").length;
        const thermals = data.filter((l) => l.incident_type === "THERMAL").length;
        const water_leaks = data.filter((l) => l.incident_type === "WATER_LEAK").length;
        const normals = data.filter((l) => l.incident_type === "NORMAL").length;

        setSummary({
          total_events: data.length,
          impacts,
          vibrations,
          thermals,
          water_leaks,
          normals,
        });

        // Process latest data for real-time display
        if (data.length > 0) {
          const latest = data[0];
          if (latest.data?.camera_image) {
            const img = latest.data.camera_image;
            setImageSrc(img.startsWith("data") ? img : `data:image/jpeg;base64,${img}`);
          }
          if (latest.data?.thermal_data && latest.data.thermal_data.length > 0) {
            setThermalData(latest.data.thermal_data);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [deviceId, fromParam, toParam]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`proteksi_aset_${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "proteksi_aset_logs",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newLog = payload.new as ProteksiAsetLog;
          console.log("[ProteksiAsetView] New log received:", newLog);

          // Update logs list
          setLogs((prev) => [newLog, ...prev].slice(0, 100));

          // Update summary
          setSummary((prev) => ({
            ...prev,
            total_events: prev.total_events + 1,
            impacts: prev.impacts + (newLog.incident_type === "IMPACT" ? 1 : 0),
            vibrations: prev.vibrations + (newLog.incident_type === "VIBRATION" ? 1 : 0),
            thermals: prev.thermals + (newLog.incident_type === "THERMAL" ? 1 : 0),
            water_leaks: prev.water_leaks + (newLog.incident_type === "WATER_LEAK" ? 1 : 0),
            normals: prev.normals + (newLog.incident_type === "NORMAL" ? 1 : 0),
          }));

          // Update real-time data displays
          if (newLog.data?.camera_image) {
            const img = newLog.data.camera_image;
            setImageSrc(img.startsWith("data") ? img : `data:image/jpeg;base64,${img}`);
          }

          if (newLog.data?.thermal_data && newLog.data.thermal_data.length > 0) {
            setThermalData(newLog.data.thermal_data);
            const avg =
              newLog.data.thermal_data.reduce((a, b) => a + b, 0) /
              newLog.data.thermal_data.length;
            const now = new Date();
            setFullTempHistory((prev) =>
              [
                ...prev,
                {
                  time: now.toLocaleTimeString("id-ID"),
                  timestamp: now.getTime(),
                  value: parseFloat(avg.toFixed(1)),
                  raw: 0,
                },
              ].slice(-10000)
            );
          }

          if (newLog.data?.water_level !== undefined) {
            const now = new Date();
            setFullWaterHistory((prev) =>
              [
                ...prev,
                {
                  time: now.toLocaleTimeString("id-ID"),
                  timestamp: now.getTime(),
                  value: newLog.data?.water_level || 0,
                  raw: newLog.data?.water_raw || 0,
                },
              ].slice(-10000)
            );
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        console.log("[ProteksiAsetView] Supabase subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, supabase]);

  // Thermal statistics
  const thermalStats = useMemo(() => {
    if (thermalData.length === 0) return { min: 0, max: 0, avg: 0 };
    return {
      min: Math.min(...thermalData),
      max: Math.max(...thermalData),
      avg: thermalData.reduce((a, b) => a + b, 0) / thermalData.length,
    };
  }, [thermalData]);

  const gradientMarkerPos = useMemo(() => {
    if (thermalStats.max === thermalStats.min) return 50;
    const pos =
      ((thermalStats.avg - thermalStats.min) / (thermalStats.max - thermalStats.min)) *
      100;
    return Math.max(0, Math.min(100, pos));
  }, [thermalStats]);

  const isThermalAlert = thermalStats.avg > parseFloat(thresholdInput);

  const lastWaterStatus = useMemo(() => {
    if (fullWaterHistory.length === 0) return { mm: 0, raw: 0, isAlert: false };
    const last = fullWaterHistory[fullWaterHistory.length - 1];
    const isAlert = last.value >= 0.5 && Date.now() - last.timestamp < 60000;
    return { mm: last.value, raw: last.raw, isAlert };
  }, [fullWaterHistory]);

  // Save threshold handler
  const handleSaveThreshold = async () => {
    setIsSaving(true);
    try {
      // Save locally for now
      localStorage.setItem("proteksi_threshold", thresholdInput);
      alert(`Setting Threshold ${thresholdInput}°C Tersimpan!`);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter data by time range
  const getFilteredData = (data: ChartData[], range: TimeRange) => {
    if (range === "Realtime") return data.slice(-30);
    const now = Date.now();
    let duration = 0;
    switch (range) {
      case "1m":
        duration = 60000;
        break;
      case "1h":
        duration = 3600000;
        break;
      case "1d":
        duration = 86400000;
        break;
      case "1w":
        duration = 604800000;
        break;
      case "1mo":
        duration = 2592000000;
        break;
      case "1y":
        duration = 31536000000;
        break;
    }
    return data.filter((d) => d.timestamp > now - duration);
  };

  // Get pixel color for thermal grid
  const getPixelColor = (temp: number) => {
    const min = thermalStats.min || 20;
    const max = thermalStats.max || 40;
    let n = (temp - min) / (max - min);
    if (isNaN(n)) n = 0;
    n = Math.max(0, Math.min(1, n));
    const h = (1 - n) * 240;
    return `hsl(${h}, 100%, 50%)`;
  };

  // Incident type badge styling
  const getIncidentBadgeClass = (type: string): string => {
    switch (type) {
      case "IMPACT":
        return "bg-red-500 text-white border-red-600";
      case "VIBRATION":
        return "bg-orange-500 text-white border-orange-600";
      case "THERMAL":
        return "bg-yellow-500 text-black border-yellow-600";
      case "WATER_LEAK":
        return "bg-cyan-500 text-white border-cyan-600";
      default:
        return "bg-green-500 text-white border-green-600";
    }
  };

  if (!isMounted) {
    return (
      <div className="p-10 text-center text-muted-foreground">Loading System...</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mb-10">
      {/* Header with Time Display */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-card border border-border p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg text-card-foreground">
            {currentTime?.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 md:mt-0">
          <Badge className={isConnected ? "bg-green-500" : "bg-red-500"}>
            {isConnected ? "REALTIME AKTIF" : "OFFLINE"}
          </Badge>
          <span className="font-mono text-2xl font-black text-foreground bg-muted/50 px-4 py-1 rounded border border-border">
            {currentTime?.toLocaleTimeString("id-ID", { hour12: false })}
          </span>
          <Clock className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="flex justify-end">
        <DateRangePicker />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{summary.total_events}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-500">{summary.impacts}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vibration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">
                {summary.vibrations}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Thermal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">
                {summary.thermals}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-200 dark:border-cyan-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Water Leak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-cyan-500" />
              <span className="text-2xl font-bold text-cyan-500">
                {summary.water_leaks}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Normal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-500">{summary.normals}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera & Thermal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Card */}
        <Card className="shadow-md border-t-4 border-t-blue-500 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-card-foreground flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Real-Time Camera OV2640
            </CardTitle>
            <Badge className={isConnected ? "bg-green-500" : "bg-red-500"}>
              {isConnected ? "ONLINE" : "OFFLINE"}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden relative shadow-inner border border-border">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ transform: "rotate(180deg) scaleX(-1)" }}
                  alt="Camera feed"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Camera className="w-12 h-12 mb-2 opacity-50" />
                  <span>Menunggu Gambar...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thermal Grid Card */}
        <Card
          className={`shadow-md border-t-4 transition-colors duration-300 bg-card ${
            isThermalAlert
              ? "border-t-red-600 dark:bg-red-950/20 bg-red-50"
              : "border-t-orange-500"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex gap-2 text-card-foreground">
              <Thermometer className="w-5 h-5" />
              Thermal Imager MLX90640
              {isThermalAlert && (
                <AlertTriangle className="text-red-600 w-5 h-5 animate-bounce" />
              )}
            </CardTitle>
            <Badge variant="neutral" className="text-card-foreground border-border">
              Avg: {thermalStats.avg.toFixed(1)}°C
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Thermal Grid */}
            <div
              className="w-full aspect-[4/3] bg-zinc-950 rounded-lg overflow-hidden grid border border-border"
              style={{ gridTemplateColumns: `repeat(32, 1fr)` }}
            >
              {thermalData.length > 0 ? (
                thermalData.map((t, i) => (
                  <div key={i} style={{ backgroundColor: getPixelColor(t) }} />
                ))
              ) : (
                <div className="col-span-32 flex items-center justify-center text-gray-500">
                  <Thermometer className="w-8 h-8 mr-2 opacity-50" />
                  Menunggu Data...
                </div>
              )}
            </div>

            {/* Gradient Bar */}
            <div
              className="relative h-6 w-full rounded-full border border-border shadow-inner mt-10"
              style={{
                background:
                  "linear-gradient(90deg, blue 0%, cyan 25%, lime 50%, yellow 75%, red 100%)",
              }}
            >
              <div
                className="absolute -top-7 transform -translate-x-1/2 flex flex-col items-center transition-all duration-300 ease-out z-10"
                style={{ left: `${gradientMarkerPos}%` }}
              >
                <span className="text-[11px] font-bold bg-background text-foreground px-2 py-0.5 rounded shadow-sm border border-border mb-0.5 whitespace-nowrap">
                  {thermalStats.avg.toFixed(1)}°C
                </span>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-foreground" />
              </div>
              <span className="absolute -bottom-5 left-0 text-[10px] font-bold text-blue-500">
                MIN: {thermalStats.min.toFixed(1)}°C
              </span>
              <span className="absolute -bottom-5 right-0 text-[10px] font-bold text-red-500">
                MAX: {thermalStats.max.toFixed(1)}°C
              </span>
            </div>

            {/* Settings */}
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded border border-border">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-bold text-card-foreground">Batas Suhu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    className="h-8 w-20 font-bold text-center bg-background border-input text-foreground"
                  />
                  <Button onClick={handleSaveThreshold} disabled={isSaving} size="sm" className="h-8">
                    {isSaving ? "..." : "Simpan"}
                  </Button>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Water Level & Temperature Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Level Chart */}
        <Card
          className={
            lastWaterStatus.isAlert
              ? "ring-2 ring-cyan-500 shadow-lg bg-card border-cyan-500"
              : "shadow-md bg-card"
          }
        >
          <CardHeader className="py-3 border-b border-border bg-cyan-500/10 flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-cyan-500/20 rounded text-cyan-600 dark:text-cyan-400">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm font-bold text-card-foreground flex items-center gap-2">
                  Water Level History
                  {lastWaterStatus.isAlert && (
                    <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 font-mono">
                  <Activity className="w-3 h-3" />
                  <span>RAW: {lastWaterStatus.raw}</span>
                  <span className="mx-1">|</span>
                  <span>Level: {lastWaterStatus.mm} mm</span>
                </div>
              </div>
            </div>
            {lastWaterStatus.isAlert && (
              <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse shadow-sm">
                ⚠️ GENANGAN
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-1">
              {(["Realtime", "1m", "1h", "1d", "1w", "1mo", "1y"] as TimeRange[]).map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => setWaterRange(r)}
                    className={`text-[10px] px-2 py-1 rounded transition-colors border ${
                      waterRange === r
                        ? "bg-cyan-600 text-white border-cyan-700"
                        : "bg-background hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {r}
                  </button>
                )
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getFilteredData(fullWaterHistory, waterRange)}>
                <defs>
                  <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.1}
                  vertical={false}
                  stroke="currentColor"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  minTickGap={30}
                  tickMargin={10}
                  strokeOpacity={0.2}
                />
                <YAxis
                  unit=" mm"
                  domain={[0, 50]}
                  width={50}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  tickCount={6}
                  strokeOpacity={0.2}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={lastWaterStatus.isAlert ? "#dc2626" : "#0891b2"}
                  strokeWidth={2}
                  fill="url(#colorWater)"
                  isAnimationActive={false}
                />
                <ReferenceLine
                  y={48}
                  stroke="red"
                  strokeDasharray="3 3"
                  label={{
                    value: "Max Sensor (48mm)",
                    position: "insideTopRight",
                    fill: "red",
                    fontSize: 10,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Temperature Chart */}
        <Card className="bg-card shadow-md">
          <CardHeader className="py-3 border-b border-border bg-orange-500/10 flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-orange-500/20 rounded text-orange-600 dark:text-orange-400">
                <Thermometer className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-bold text-card-foreground">
                Temperature History
              </CardTitle>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {(["Realtime", "1m", "1h", "1d", "1w", "1mo", "1y"] as TimeRange[]).map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => setTempRange(r)}
                    className={`text-[10px] px-2 py-1 rounded transition-colors border ${
                      tempRange === r
                        ? "bg-orange-600 text-white border-orange-700"
                        : "bg-background hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {r}
                  </button>
                )
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getFilteredData(fullTempHistory, tempRange)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.1}
                  vertical={false}
                  stroke="currentColor"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  minTickGap={30}
                  tickMargin={10}
                  strokeOpacity={0.2}
                />
                <YAxis
                  unit="°C"
                  domain={["dataMin - 2", "dataMax + 2"]}
                  width={40}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  tickCount={8}
                  strokeOpacity={0.2}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <ReferenceLine
                  y={parseFloat(thresholdInput)}
                  stroke="red"
                  strokeDasharray="5 5"
                  label={{
                    value: `Limit ${thresholdInput}°C`,
                    fill: "red",
                    fontSize: 10,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Incident Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Log Insiden Proteksi Aset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Tipe Insiden</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada data insiden
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), "dd MMM yyyy HH:mm:ss", {
                          locale: localeID,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getIncidentBadgeClass(log.incident_type)}>
                          {log.incident_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {(log.confidence * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {log.is_cleared ? (
                          <Badge variant="neutral" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Cleared
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-yellow-600 border-yellow-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
