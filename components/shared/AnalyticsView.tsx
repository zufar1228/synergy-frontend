"use client"; // Menandakan ini adalah Client Component

import React, { useEffect, useState } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Definisikan tipe data yang diterima komponen ini
// Ini harus cocok dengan response dari API analytics kita
interface Log {
  id: string;
  timestamp: string;
  payload: any;
  temperature?: number | null;
  humidity?: number | null;
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
interface AnalyticsViewProps {
  initialData: AnalyticsData;
  systemType: string;
  areaId: string;
}

export const AnalyticsView = ({
  initialData,
  systemType,
  areaId,
}: AnalyticsViewProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<Log[]>(initialData.logs);
  const [summary, setSummary] = useState(initialData.summary);
  const { pagination } = initialData;

  // Efek untuk berlangganan ke perubahan Supabase Realtime
  useEffect(() => {
    // Buat channel subscription
    const channel = supabase
      .channel(`realtime-logs:${areaId}:${systemType}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: `${systemType}_logs` },
        (payload) => {
          console.log("New log received!", payload);
          const newLog = payload.new as Log;

          // Tambahkan log baru ke awal array
          // Kita juga membatasi jumlah log di state agar UI tidak overload
          setLogs((currentLogs) => [newLog, ...currentLogs.slice(0, 24)]);

          // (Enhancement) Di sini Anda bisa menambahkan logika untuk meng-update summary
        }
      )
      .subscribe();

    // Fungsi cleanup: unsubscribe saat komponen dilepas
    return () => {
      supabase.removeChannel(channel);
    };
  }, [systemType, areaId]);

  // Siapkan data untuk grafik (reverse agar waktu berjalan dari kiri ke kanan)
  const chartData = logs
    .map((log) => ({
      name: format(new Date(log.timestamp), "HH:mm:ss"),
      Suhu: log.temperature,
      Kelembapan: log.humidity,
    }))
    .reverse();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Kartu Ringkasan */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(summary).map(([key, value]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-sm font-medium capitalize">
                {key.replace("_", " ")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Grafik Garis */}
      {systemType === "lingkungan" && (
        <Card>
          <CardHeader>
            <CardTitle>Grafik Sensor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Suhu"
                  stroke="#ef4444"
                  activeDot={{ r: 8 }}
                />
                <Line type="monotone" dataKey="Kelembapan" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 3. Tabel Log */}
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
                <TableHead>Detail Payload</TableHead>
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
                  <TableCell className="font-mono text-xs">
                    {JSON.stringify(log.payload)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 4. Kontrol Paginasi */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          size="sm"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Previous
        </Button>
        <span>
          Page {pagination.page} of {pagination.total_pages}
        </span>
        <Button
          size="sm"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.total_pages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
