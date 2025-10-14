"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { IncidentTypeChart } from "./IncidentTypeChart";
import { IncidentDataTable } from "./IncidentDataTable";
import { DateRangePicker } from "@/components/ui/date-range-picker"; // <-- 1. IMPORT
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// Tipe data yang relevan untuk insiden
interface AnalyticsIncident {
  id: string;
  created_at: string;
  incident_type: string;
  confidence: number | null;
  device: { name: string };
  // Tambahkan field yang diperlukan untuk IncidentDataTable
  area_id: string;
  device_id: string;
  system_type: string;
  status: "unacknowledged" | "acknowledged" | "resolved" | "false_alarm";
  notes?: string | null;
  updated_at?: string;
}
interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
interface AnalyticsData {
  summary: { total_incidents: number; most_frequent?: string };
  logs: AnalyticsIncident[];
  pagination: Pagination;
}

export const GangguanView = ({
  initialData,
}: {
  initialData: AnalyticsData;
}) => {
  const params = useParams();
  const areaId = params.areaId as string;

  const [logs, setLogs] = useState(initialData.logs);
  const [summary, setSummary] = useState(initialData.summary);
  const { pagination } = initialData;

  // Sync logs state when initialData changes (e.g., due to pagination)
  useEffect(() => {
    setLogs(initialData.logs);
    setSummary(initialData.summary);
  }, [initialData.logs, initialData.summary]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-gangguan`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "incidents" },
        (payload: any) => {
          console.log("New incident received!", payload.new);
          const newIncident = {
            ...(payload.new as object),
            device: { name: "Loading..." },
            // Tambahkan default values untuk field yang diperlukan
            area_id: payload.new.area_id || "",
            device_id: payload.new.device_id || "",
            system_type: payload.new.system_type || "gangguan",
            status: payload.new.status || "unacknowledged",
            notes: payload.new.notes || null,
            updated_at: payload.new.updated_at,
          } as AnalyticsIncident;
          setLogs((currentLogs) => [newIncident, ...currentLogs]);
          setSummary((currentSummary) => ({
            ...currentSummary,
            total_incidents: currentSummary.total_incidents + 1,
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "incidents" },
        (payload: any) => {
          console.log("Incident updated!", payload.new);
          setLogs((currentLogs) =>
            currentLogs.map((incident) =>
              incident.id === payload.new.id
                ? {
                    ...incident,
                    status: payload.new.status,
                    notes: payload.new.notes,
                    updated_at: payload.new.updated_at,
                  }
                : incident
            )
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* 2. ADD DATE RANGE PICKER HERE */}
      <div className="flex justify-end">
        <DateRangePicker />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Insiden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_incidents}</div>
          </CardContent>
        </Card>
        {summary.most_frequent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Insiden Paling Sering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.most_frequent}</div>
            </CardContent>
          </Card>
        )}
      </div>
      <IncidentTypeChart areaId={areaId} />

      <IncidentDataTable data={logs} pagination={pagination} />
    </div>
  );
};
