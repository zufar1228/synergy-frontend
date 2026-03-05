'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';
import type { LingkunganLog } from '@/lib/api';

interface ChartDataPoint {
  time: string;
  temperature?: number;
  humidity?: number;
  co2?: number;
}

interface PredictionDataPoint {
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
  // Build chart data from logs if realtime data is empty
  const chartData = useMemo(() => {
    if (actualData.length > 0) {
      // Merge actual and prediction data by time
      const merged: Record<string, any> = {};

      actualData.forEach((d) => {
        if (!merged[d.time]) merged[d.time] = { time: d.time };
        merged[d.time].temperature = d.temperature;
        merged[d.time].humidity = d.humidity;
        merged[d.time].co2 = d.co2;
      });

      predictionData.forEach((d) => {
        if (!merged[d.time]) merged[d.time] = { time: d.time };
        merged[d.time].pred_temperature = d.predicted_temperature;
        merged[d.time].pred_humidity = d.predicted_humidity;
        merged[d.time].pred_co2 = d.predicted_co2;
      });

      return Object.values(merged).sort((a, b) => a.time.localeCompare(b.time));
    }

    // Fall back to logs data
    const sorted = [...logs]
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .slice(-50);

    return sorted.map((log) => ({
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} domain={['auto', 'auto']} unit="°C" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Aktual (°C)"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="pred_temperature"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Prediksi (°C)"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="humidity">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} domain={['auto', 'auto']} unit="%" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Aktual (%RH)"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="pred_humidity"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Prediksi (%RH)"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="co2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} domain={['auto', 'auto']} unit=" ppm" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="co2"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Aktual (ppm)"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="pred_co2"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Prediksi (ppm)"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
