'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        color: EVENT_COLORS[type] || '#94a3b8'
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

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
          <div className="w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-base border-2 border-border bg-background px-3 py-2 shadow-md">
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.value} event ({Math.round((d.value / total) * 100)}
                          %)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap sm:flex-col gap-x-4 gap-y-1.5 sm:gap-y-2 justify-center sm:justify-start">
            {chartData.map((entry) => (
              <div
                key={entry.type}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <span
                  className="inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
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
