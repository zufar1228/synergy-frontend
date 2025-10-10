// frontend/components/analytics/LingkunganView.tsx
"use client";

import React, { useState, useEffect } from "react"; // <-- Perubahan: Menambahkan useState dan useEffect
import { supabase } from "@/lib/supabase"; // <-- Baru: Import client Supabase
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

// Definisikan tipe data yang diterima (sama seperti sebelumnya)
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

export const LingkunganView = ({
  initialData,
}: {
  initialData: AnalyticsData;
}) => {
  // --- PERUBAHAN UTAMA DIMULAI DI SINI ---

  // 1. Gunakan state agar UI bisa di-update secara real-time
  const [logs, setLogs] = useState(initialData.logs);
  const [summary, setSummary] = useState(initialData.summary);

  const router = useRouter();
  const searchParams = useSearchParams();
  // Kita tetap ambil pagination dari initialData karena tidak berubah secara real-time
  const { pagination } = initialData;

  // 2. Efek untuk berlangganan (subscribe) ke perubahan data di Supabase
  useEffect(() => {
    // Membuat channel komunikasi real-time
    const channel = supabase
      .channel(`realtime-lingkungan`)
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Hanya dengarkan event 'INSERT' (data baru)
          schema: "public",
          table: "lingkungan_logs", // Pada tabel 'lingkungan_logs'
        },
        (payload) => {
          console.log("Data log lingkungan baru diterima!", payload.new);
          // Tambahkan data baru ke awal array logs
          // Ini akan secara otomatis memicu re-render pada komponen
          setLogs((currentLogs) => [payload.new as Log, ...currentLogs]);

          // Catatan: Jika Anda ingin summary juga update, Anda perlu logika tambahan di sini
          // untuk mengkalkulasi ulang summary berdasarkan data baru.
        }
      )
      .subscribe();

    // 3. Fungsi cleanup: Berhenti mendengarkan saat komponen dilepas (unmount)
    // Ini penting untuk mencegah memory leak!
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Array dependensi kosong '[]' berarti efek ini hanya berjalan sekali saat komponen pertama kali render

  // --- AKHIR DARI PERUBAHAN UTAMA ---

  // Sisa kode di bawah ini menggunakan state 'logs' dan 'summary',
  // sehingga akan otomatis ter-update.

  const chartData = logs
    .map((log) => ({
      name: format(new Date(log.timestamp), "HH:mm"),
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
      {/* 1. Kartu Ringkasan */}
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
                yAxisId="right"
                orientation="right"
                stroke="#3b82f6"
                label={{ value: "%", angle: -90, position: "insideRight" }}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Suhu"
                stroke="#ef4444"
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Kelembapan"
                stroke="#3b82f6"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 4. Kontrol Paginasi */}
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
