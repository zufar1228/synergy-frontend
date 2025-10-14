// frontend/components/analytics/IncidentTypeChart.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getIncidentSummaryByType, IncidentSummary } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const chartConfig = {
  total: {
    label: "Total Insiden",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function IncidentTypeChart({ areaId }: { areaId: string }) {
  const [data, setData] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams(); // <-- Get searchParams

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Get 'from' and 'to' from URL
      const from = searchParams.get("from");
      const to = searchParams.get("to");

      try {
        const result = await getIncidentSummaryByType(session.access_token, {
          area_id: areaId,
          from: from || undefined, // Send undefined if null
          to: to || undefined,
        });
        setData(result);
      } catch (error) {
        toast.error("Gagal memuat data chart.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams, areaId]); // <-- Re-run effect if searchParams changes

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Type Distribution</CardTitle>
        <CardDescription>
          Based on most frequently occurring type
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data insiden.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <YAxis dataKey="total" allowDecimals={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="total" fill="var(--color-chart-1)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
