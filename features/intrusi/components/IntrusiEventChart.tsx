/**
 * @file IntrusiEventChart.tsx
 * @purpose Chart visualization for intrusi event frequency over time
 * @usedBy IntrusiView
 * @deps recharts, Chart UI
 * @exports IntrusiEventChart
 * @sideEffects None (data via props)
 */

'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { IntrusiLog } from '@/lib/api';

const EVENT_COLORS: Record<string, string> = {
  FORCED_ENTRY_ALARM: '#dc2626',
  UNAUTHORIZED_OPEN: '#ef4444',
  IMPACT_WARNING: '#eab308',
  ARM: '#22c55e',
  DISARM: '#6b7280',
  BATTERY_LEVEL_CHANGED: '#f97316',
  POWER_SOURCE_CHANGED: '#8b5cf6',
  SIREN_SILENCED: '#64748b'
};

const EVENT_LABELS: Record<string, string> = {
  FORCED_ENTRY_ALARM: 'Paksa Masuk',
  UNAUTHORIZED_OPEN: 'Tanpa Izin',
  IMPACT_WARNING: 'Benturan',
  ARM: 'Aktivasi',
  DISARM: 'Nonaktif',
  BATTERY_LEVEL_CHANGED: 'Baterai',
  POWER_SOURCE_CHANGED: 'Ganti Daya',
  SIREN_SILENCED: 'Sirine Mati'
};

interface IntrusiEventChartProps {
  logs: IntrusiLog[];
}

export function IntrusiEventChart({ logs }: IntrusiEventChartProps) {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of logs) {
      counts[log.event_type] = (counts[log.event_type] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([type, count]) => ({
        name: EVENT_LABELS[type] || type,
        value: count,
        type,
        fill: EVENT_COLORS[type] || '#94a3b8'
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    for (const entry of chartData) {
      config[entry.type] = {
        label: entry.name,
        color: entry.fill
      };
    }
    return config;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribusi Event
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[180px] sm:h-[220px]">
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        </CardContent>
      </Card>
    );
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="h-full">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Distribusi Event
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <ChartContainer
            config={chartConfig}
            className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] shrink-0 !aspect-square"
          >
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                dataKey="value"
                nameKey="type"
                stroke="none"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const v = Number(value);
                      return (
                        <span>
                          {v} event ({Math.round((v / total) * 100)}%)
                        </span>
                      );
                    }}
                    nameKey="type"
                  />
                }
              />
            </PieChart>
          </ChartContainer>
          <div className="flex flex-wrap sm:flex-col gap-x-4 gap-y-1.5 sm:gap-y-2 justify-center sm:justify-start">
            {chartData.map((entry) => (
              <div
                key={entry.type}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <span
                  className="inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-foreground/80">{entry.name}</span>
                <span className="font-semibold ml-auto tabular-nums">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
