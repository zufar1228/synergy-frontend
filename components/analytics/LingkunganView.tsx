// frontend/components/analytics/LingkunganView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FanControl } from "./FanControl";
import { useDeviceStatus } from "@/contexts/DeviceStatusContext";

// 1. Perbarui tipe data
interface Log {
  id: string;
  timestamp: string;
  payload: any;
  temperature?: number | null;
  humidity?: number | null;
  co2_ppm?: number | null; // <-- TAMBAHKAN
}
interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
interface AnalyticsData {
  summary: { [key: string]: any };
  logs: Log[];
  pagination: Pagination;
}

export const LingkunganView = ({
  initialData,
}: {
  initialData: AnalyticsData;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const areaId = params.areaId as string;
  const { updateDeviceStatus } = useDeviceStatus();

  const [logs, setLogs] = useState(initialData.logs);
  const [summary, setSummary] = useState(initialData.summary);
  const [lastDataTimestamp, setLastDataTimestamp] = useState<Date | null>(null);
  const { pagination } = initialData;

  useEffect(() => {
    setLogs(initialData.logs);
    setSummary(initialData.summary);
    // Set initial timestamp if we have data
    if (initialData.logs.length > 0) {
      setLastDataTimestamp(new Date(initialData.logs[0].timestamp));
    }
  }, [initialData]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-lingkungan`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lingkungan_logs" },
        (payload: any) => {
          setLogs((currentLogs) => [payload.new as Log, ...currentLogs]);
          setLastDataTimestamp(new Date(payload.new.timestamp));
          // Update device status context - device is online since it's sending data
          updateDeviceStatus(areaId, "lingkungan", true);
          // TODO: Update summary secara real-time (opsional)
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [areaId, updateDeviceStatus]);

  // 2. Perbarui data untuk chart
  const chartData = logs
    .map((log) => ({
      name: format(new Date(log.timestamp), "HH:mm"),
      Suhu: log.temperature,
      Kelembapan: log.humidity,
      CO2: log.co2_ppm, // <-- TAMBAHKAN
    }))
    .reverse();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Determine device status based on recent data activity
  const isDeviceOnline = lastDataTimestamp
    ? Date.now() - lastDataTimestamp.getTime() < 5 * 60 * 1000 // 5 minutes
    : logs.length > 0; // If we have any data, assume device was recently active

  return (
    <div className="space-y-8">
      {/* 3. Tambahkan komponen FanControl di sini */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Kartu Ringkasan (yang sudah ada) */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Suhu Rata-rata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avg_temp}°C</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Kelembapan Maks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.max_humidity}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  CO2 Rata-rata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.avg_co2} <span className="text-lg">ppm</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Suhu Minimum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.min_temp}°C</div>
              </CardContent>
            </Card>
          </div>

          {/* Grafik Garis (yang sudah ada) */}
          <Card>
            <CardHeader>
              <CardTitle>Grafik Sensor</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    yAxisId="left"
                    stroke="#ef4444"
                    label={{ value: "°C", angle: -90, position: "insideLeft" }}
                  />
                  <YAxis
                    yAxisId="center"
                    orientation="right"
                    stroke="#3b82f6"
                    label={{
                      value: "%",
                      angle: -90,
                      position: "insideRight",
                      offset: 40,
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#22c55e"
                    label={{
                      value: "ppm",
                      angle: -90,
                      position: "insideRight",
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Suhu"
                    stroke="#ef4444"
                    dot={false}
                  />
                  <Line
                    yAxisId="center"
                    type="monotone"
                    dataKey="Kelembapan"
                    stroke="#3b82f6"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="CO2"
                    stroke="#22c55e"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Kolom baru untuk FanControl */}
        <div className="md:col-span-1">
          <FanControl areaId={areaId} isDeviceOnline={isDeviceOnline} />
        </div>
      </div>

      {/* 5. Perbarui Tabel Log */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Suhu (°C)</TableHead>
                <TableHead>Kelembapan (%)</TableHead>
                <TableHead>CO2 (ppm)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.timestamp), "dd MMM, HH:mm:ss")}
                  </TableCell>
                  <TableCell>{log.temperature ?? "N/A"}</TableCell>
                  <TableCell>{log.humidity ?? "N/A"}</TableCell>
                  <TableCell>{log.co2_ppm ?? "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ... (Kontrol Paginasi tidak berubah) ... */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Previous
        </Button>
        <span>
          Page {pagination.page} of {pagination.total_pages}
        </span>
        <Button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.total_pages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
