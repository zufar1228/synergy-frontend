// frontend/components/analytics/IncidentTypeChart.tsx
"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getIncidentSummaryByType, IncidentSummary } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { subDays, formatISO } from "date-fns";

const chartConfig = {
  total: {
    label: "Total Insiden",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function IncidentTypeChart({ areaId }: { areaId: string }) {
  const [data, setData] = useState<IncidentSummary[]>([]);
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const to = new Date();
      let from;
      switch (timeRange) {
        case "30d":
          from = subDays(to, 30);
          break;
        case "90d":
          from = subDays(to, 90);
          break;
        case "7d":
        default:
          from = subDays(to, 7);
          break;
      }

      try {
        const result = await getIncidentSummaryByType(session.access_token, {
          area_id: areaId,
          from: from.toISOString(),
          to: to.toISOString(),
        });
        setData(result);
      } catch (error) {
        toast.error("Gagal memuat data chart.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange, areaId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Distribusi Tipe Insiden</CardTitle>
          <CardDescription>
            Berdasarkan tipe yang paling sering terjadi
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Hari Terakhir</SelectItem>
            <SelectItem value="30d">30 Hari Terakhir</SelectItem>
            <SelectItem value="90d">90 Hari Terakhir</SelectItem>
          </SelectContent>
        </Select>
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
