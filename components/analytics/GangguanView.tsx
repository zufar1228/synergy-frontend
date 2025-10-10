"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { IncidentTypeChart } from "./IncidentTypeChart";
import { IncidentDataTable } from "./IncidentDataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// Tipe data yang relevan untuk insiden
interface Incident {
  id: string;
  created_at: string;
  incident_type: string;
  confidence: number | null;
  device: { name: string };
}
interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
interface AnalyticsData {
  summary: { total_incidents: number; most_frequent?: string };
  logs: Incident[];
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
          } as Incident;
          setLogs((currentLogs) => [newIncident, ...currentLogs]);
          setSummary((currentSummary) => ({
            ...currentSummary,
            total_incidents: currentSummary.total_incidents + 1,
          }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8">
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
