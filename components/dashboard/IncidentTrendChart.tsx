// frontend/components/dashboard/IncidentTrendChart.tsx
"use client";

import { useState, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { getIncidentTrendByWarehouse, IncidentTrendPoint } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { subDays } from "date-fns";

const chartConfig = {
  total: { label: "Total Insiden", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function IncidentTrendChart({ warehouseId }: { warehouseId: string }) {
  const [data, setData] = useState<IncidentTrendPoint[]>([]);
  const [timeRange, setTimeRange] = useState("30d");
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
        case "7d":
          from = subDays(to, 7);
          break;
        case "90d":
          from = subDays(to, 90);
          break;
        case "30d":
        default:
          from = subDays(to, 30);
          break;
      }

      try {
        const result = await getIncidentTrendByWarehouse(session.access_token, {
          warehouse_id: warehouseId,
          from: from.toISOString(),
          to: to.toISOString(),
        });
        setData(result);
      } catch (error) {
        toast.error("Gagal memuat data tren insiden.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange, warehouseId]);

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tren Insiden</CardTitle>
          <CardDescription>Jumlah insiden terdeteksi per hari</CardDescription>
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
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <YAxis dataKey="total" allowDecimals={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area
                dataKey="total"
                type="natural"
                fill="var(--color-chart-4)"
                fillOpacity={0.4}
                stroke="var(--color-chart-4)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
