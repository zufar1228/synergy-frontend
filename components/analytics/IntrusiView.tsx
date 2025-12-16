"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { IntrusiMonitor } from "./IntrusiMonitor";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { subDays } from "date-fns";
import { useSearchParams } from "next/navigation";

interface IntrusiLog {
  id: string;
  device_id: string;
  event_class: "Normal" | "Disturbance" | "Intrusion";
  confidence: number;
  payload: object | null;
  timestamp: string;
  device?: {
    name: string;
    area?: {
      name: string;
    };
  };
}

interface IntrusiSummary {
  total_events: number;
  intrusions: number;
  disturbances: number;
  normals: number;
}

interface IntrusiViewProps {
  deviceId: string;
  initialData?: {
    logs: IntrusiLog[];
    summary: IntrusiSummary;
  };
}

export const IntrusiView = ({ deviceId, initialData }: IntrusiViewProps) => {
  const [logs, setLogs] = useState<IntrusiLog[]>(initialData?.logs || []);
  const [summary, setSummary] = useState<IntrusiSummary>(
    initialData?.summary || {
      total_events: 0,
      intrusions: 0,
      disturbances: 0,
      normals: 0,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const supabase = createClient();

  // Get date range from URL params (set by DateRangePicker)
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Fetch logs based on date range from URL
  const fetchLogs = async () => {
    // Use URL params or default to last 7 days
    const from = fromParam ? new Date(fromParam) : subDays(new Date(), 7);
    const to = toParam ? new Date(toParam) : new Date();

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("intrusi_logs")
        .select("*")
        .eq("device_id", deviceId)
        .gte("timestamp", from.toISOString())
        .lte("timestamp", to.toISOString())
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[IntrusiView] Error fetching logs:", error);
        return;
      }

      if (data) {
        setLogs(data as IntrusiLog[]);

        // Calculate summary
        const intrusions = data.filter((l) => l.event_class === "Intrusion").length;
        const disturbances = data.filter((l) => l.event_class === "Disturbance").length;
        const normals = data.filter((l) => l.event_class === "Normal").length;

        setSummary({
          total_events: data.length,
          intrusions,
          disturbances,
          normals,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [deviceId, fromParam, toParam]);

  // Sync with initialData
  useEffect(() => {
    if (initialData) {
      setLogs(initialData.logs);
      setSummary(initialData.summary);
    }
  }, [initialData]);

  const getEventClassName = (eventClass: string): string => {
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
    <div className="space-y-6">
      {/* Header with Date Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Sistem Deteksi Intrusi (TinyML)
          </h2>
          <p className="text-muted-foreground">
            Monitoring keamanan berbasis AI Edge Computing
          </p>
        </div>
        <DateRangePicker />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Intrusi Terdeteksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-500">
                {summary.intrusions}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gangguan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">
                {summary.disturbances}
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
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-500">
                {summary.normals}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Real-time Monitor + History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Monitor */}
        <IntrusiMonitor deviceId={deviceId} />

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Event</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">Memuat...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mb-2 opacity-50" />
                  <p>Tidak ada event dalam rentang waktu ini.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className={getEventClassName(log.event_class)}>
                            {log.event_class}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(log.confidence * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.timestamp), "dd MMM HH:mm:ss", {
                            locale: localeID,
                          })}
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
    </div>
  );
};

export default IntrusiView;
