// frontend/components/analytics/KeamananView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeamananDataTable } from "./KeamananDataTable";
import { createClient } from "@/lib/supabase/client";
import { DateRangePicker } from "@/components/ui/date-range-picker"; // <-- 1. IMPORT

export const KeamananView = ({ initialData }: { initialData: any }) => {
  const [logs, setLogs] = useState(initialData.logs);
  const [summary, setSummary] = useState(initialData.summary);
  const [pagination, setPagination] = useState(initialData.pagination);

  // === TAMBAHKAN BLOK INI ===
  // Efek ini akan menyinkronkan state dengan prop
  // setiap kali data dari server (initialData) berubah.
  useEffect(() => {
    setLogs(initialData.logs);
    setSummary(initialData.summary);
  }, [initialData]);
  // ==========================

  // Function to update a log locally (fallback for real-time)
  const updateLogLocally = (logId: string, updates: Partial<any>) => {
    console.log("Updating log locally:", logId, updates);
    setLogs((currentLogs: any[]) =>
      currentLogs.map((log: any) =>
        log.id === logId ? { ...log, ...updates } : log
      )
    );

    // Also update summary if status changed
    if (updates.status) {
      setSummary((s: any) => {
        const currentLog = logs.find((l: any) => l.id === logId);
        if (!currentLog) return s;

        const newSummary = { ...s };

        // If status changed from unacknowledged to acknowledged/resolved
        if (
          currentLog.status === "unacknowledged" &&
          updates.status !== "unacknowledged"
        ) {
          newSummary.unacknowledged_alerts = Math.max(
            0,
            s.unacknowledged_alerts - 1
          );
        }
        // If status changed back to unacknowledged
        else if (
          currentLog.status !== "unacknowledged" &&
          updates.status === "unacknowledged"
        ) {
          newSummary.unacknowledged_alerts = s.unacknowledged_alerts + 1;
        }

        return newSummary;
      });
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime-keamanan")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "keamanan_logs" },
        (payload) => {
          console.log("Real-time INSERT:", payload.new);
          setLogs((currentLogs: any[]) => [payload.new, ...currentLogs]);
          setSummary((s: any) => ({
            ...s,
            total_detections: s.total_detections + 1,
            unacknowledged_alerts: s.unacknowledged_alerts + 1,
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "keamanan_logs" },
        (payload) => {
          console.log("Real-time UPDATE:", payload.new);
          setLogs((currentLogs: any[]) =>
            currentLogs.map((log: any) =>
              log.id === payload.new.id ? payload.new : log
            )
          );
          // Update summary based on status change
          setSummary((s: any) => {
            const oldLog = payload.old;
            const newLog = payload.new;
            const newSummary = { ...s };

            // If status changed from unacknowledged to acknowledged/resolved
            if (
              oldLog.status === "unacknowledged" &&
              newLog.status !== "unacknowledged"
            ) {
              newSummary.unacknowledged_alerts = Math.max(
                0,
                s.unacknowledged_alerts - 1
              );
            }
            // If status changed back to unacknowledged
            else if (
              oldLog.status !== "unacknowledged" &&
              newLog.status === "unacknowledged"
            ) {
              newSummary.unacknowledged_alerts = s.unacknowledged_alerts + 1;
            }

            return newSummary;
          });
        }
      )
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* 2. TAMBAHKAN DATE RANGE PICKER DI SINI */}
      <div className="flex justify-end">
        <DateRangePicker />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Deteksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_detections}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Peringatan Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.unacknowledged_alerts}
            </div>
          </CardContent>
        </Card>
      </div>
      <KeamananDataTable data={logs} pagination={pagination} />
    </div>
  );
};
