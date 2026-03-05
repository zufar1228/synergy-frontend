'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';
import type { LingkunganLog } from '@/lib/api';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';

interface ChartDataPoint {
  timestamp: string;
  time: string;
  temperature?: number;
  humidity?: number;
  co2?: number;
}

interface PredictionDataPoint {
  timestamp: string;
  time: string;
  predicted_temperature?: number;
  predicted_humidity?: number;
  predicted_co2?: number;
}

interface LingkunganChartProps {
  actualData: ChartDataPoint[];
  predictionData: PredictionDataPoint[];
  logs: LingkunganLog[];
}

export const LingkunganChart = ({
  actualData,
  predictionData,
  logs
}: LingkunganChartProps) => {
  const chartConfig: ChartConfig = {
    temperature: {
      label: 'Aktual (°C)',
      color: '#3b82f6'
    },
    pred_temperature: {
      label: 'Prediksi (°C)',
      color: '#22c55e'
    },
    humidity: {
      label: 'Aktual (%RH)',
      color: '#3b82f6'
    },
    pred_humidity: {
      label: 'Prediksi (%RH)',
      color: '#22c55e'
    },
    co2: {
      label: 'Aktual (ppm)',
      color: '#3b82f6'
    },
    pred_co2: {
      label: 'Prediksi (ppm)',
      color: '#22c55e'
    }
  };

  const formatTick = (isoTimestamp: string) => {
    const dt = new Date(isoTimestamp);
    if (Number.isNaN(dt.getTime())) return isoTimestamp;
    return dt.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTooltipTimestamp = (isoTimestamp: string) => {
    const dt = new Date(isoTimestamp);
    if (Number.isNaN(dt.getTime())) return isoTimestamp;
    return dt.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Build chart data from logs if realtime data is empty
  const chartData = useMemo(() => {
    console.log('[LingkunganChart] Building chart data:', {
      actualDataCount: actualData.length,
      predictionDataCount: predictionData.length,
      logsCount: logs.length
    });

    if (actualData.length > 0) {
      // Merge actual and prediction data by full timestamp to avoid HH:mm collisions.
      const merged: Record<string, any> = {};

      actualData.forEach((d) => {
        if (!merged[d.timestamp]) {
          merged[d.timestamp] = { timestamp: d.timestamp, time: d.time };
        }
        merged[d.timestamp].temperature = d.temperature;
        merged[d.timestamp].humidity = d.humidity;
        merged[d.timestamp].co2 = d.co2;
      });

      predictionData.forEach((d) => {
        if (!merged[d.timestamp]) {
          merged[d.timestamp] = { timestamp: d.timestamp, time: d.time };
        }
        merged[d.timestamp].pred_temperature = d.predicted_temperature;
        merged[d.timestamp].pred_humidity = d.predicted_humidity;
        merged[d.timestamp].pred_co2 = d.predicted_co2;
      });

      const sorted = Object.values(merged).sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      console.log(
        '[LingkunganChart] Using actualData, merged count:',
        sorted.length
      );
      return sorted;
    }

    // Fall back to logs data
    const sorted = [...logs]
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .slice(-120);

    console.log('[LingkunganChart] Using logs fallback, count:', sorted.length);

    return sorted.map((log) => ({
      timestamp: log.timestamp,
      time: new Date(log.timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      temperature: log.temperature,
      humidity: log.humidity,
      co2: log.co2
    }));
  }, [actualData, predictionData, logs]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Grafik Lingkungan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Belum ada data untuk ditampilkan.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Grafik Lingkungan (Aktual vs Prediksi)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="temperature" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="temperature">Suhu</TabsTrigger>
            <TabsTrigger value="humidity">Kelembapan</TabsTrigger>
            <TabsTrigger value="co2">CO₂</TabsTrigger>
          </TabsList>

          <TabsContent value="temperature">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  fontSize={12}
                  tickFormatter={formatTick}
                  minTickGap={24}
                />
                <YAxis fontSize={12} domain={['auto', 'auto']} unit="°C" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const first = payload?.[0]?.payload as
                          | { timestamp?: string }
                          | undefined;
                        return formatTooltipTimestamp(first?.timestamp || '');
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--color-temperature)"
                  strokeWidth={2}
                  name="Aktual (°C)"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="pred_temperature"
                  stroke="var(--color-pred_temperature)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Prediksi (°C)"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="humidity">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  fontSize={12}
                  tickFormatter={formatTick}
                  minTickGap={24}
                />
                <YAxis fontSize={12} domain={['auto', 'auto']} unit="%" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const first = payload?.[0]?.payload as
                          | { timestamp?: string }
                          | undefined;
                        return formatTooltipTimestamp(first?.timestamp || '');
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="var(--color-humidity)"
                  strokeWidth={2}
                  name="Aktual (%RH)"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="pred_humidity"
                  stroke="var(--color-pred_humidity)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Prediksi (%RH)"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="co2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  fontSize={12}
                  tickFormatter={formatTick}
                  minTickGap={24}
                />
                <YAxis fontSize={12} domain={['auto', 'auto']} unit=" ppm" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const first = payload?.[0]?.payload as
                          | { timestamp?: string }
                          | undefined;
                        return formatTooltipTimestamp(first?.timestamp || '');
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="co2"
                  stroke="var(--color-co2)"
                  strokeWidth={2}
                  name="Aktual (ppm)"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="pred_co2"
                  stroke="var(--color-pred_co2)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Prediksi (ppm)"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
