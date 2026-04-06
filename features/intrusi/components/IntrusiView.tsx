'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  useParams,
  useRouter,
  useSearchParams,
  usePathname
} from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IntrusiDataTable } from './IntrusiDataTable';
import { IntrusiDeviceControls } from './IntrusiDeviceControls';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/demo/api-interceptor';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { IntrusiLog } from '@/lib/api';
import { useDeviceStatus } from '@/contexts/DeviceStatusContext';
import {
  ShieldAlert,
  AlertTriangle,
  Bell,
  Activity,
  X,
  Eye,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { AnimatedPageTitle } from '@/components/shared/AnimatedPageTitle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const eventTypeLabels: Record<string, string> = {
  IMPACT_WARNING: 'Peringatan Benturan',
  FORCED_ENTRY_ALARM: 'Alarm Paksa Masuk',
  UNAUTHORIZED_OPEN: 'Buka Tanpa Izin',
  POWER_SOURCE_CHANGED: 'Ganti Daya',
  BATTERY_LEVEL_CHANGED: 'Level Baterai',
  SIREN_SILENCED: 'Sirine Dimatikan',
  ARM: 'Aktivasi Sistem',
  DISARM: 'Penonaktifan Sistem'
};

export const IntrusiView = ({ initialData }: { initialData: any }) => {
  const params = useParams();
  const areaId = params.areaId as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { updateDeviceStatus } = useDeviceStatus();

  const [logs, setLogs] = useState<IntrusiLog[]>(initialData.logs || []);
  const [deviceName, setDeviceName] = useState<string>('');
  const newRowIds = useRef<Set<string>>(new Set());
  const [summary, setSummary] = useState({
    total_events: 0,
    alarm_events: 0,
    impact_warnings: 0,
    unacknowledged: 0,
    ...initialData.summary
  });
  const [pagination, setPagination] = useState(initialData.pagination);
  const [lastDataTimestamp, setLastDataTimestamp] = useState<Date | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [timeSinceAlarm, setTimeSinceAlarm] = useState<string>('');
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setLogs(initialData.logs || []);
    setSummary({
      total_events: 0,
      alarm_events: 0,
      impact_warnings: 0,
      unacknowledged: 0,
      ...initialData.summary
    });
    setAlertDismissed(false);
    if (initialData.logs?.length > 0) {
      setLastDataTimestamp(new Date(initialData.logs[0].timestamp));
    }
  }, [initialData]);

  const updateLogLocally = (logId: string, updates: Partial<IntrusiLog>) => {
    setLogs((currentLogs) =>
      currentLogs.map((log) =>
        log.id === logId ? { ...log, ...updates } : log
      )
    );
    if (updates.status) {
      setSummary((s: any) => {
        const currentLog = logs.find((l) => l.id === logId);
        if (!currentLog) return s;
        const newSummary = { ...s };
        if (
          currentLog.status === 'unacknowledged' &&
          updates.status !== 'unacknowledged'
        ) {
          newSummary.unacknowledged = Math.max(0, s.unacknowledged - 1);
        } else if (
          currentLog.status !== 'unacknowledged' &&
          updates.status === 'unacknowledged'
        ) {
          newSummary.unacknowledged = s.unacknowledged + 1;
        }
        return newSummary;
      });
    }
  };

  // Browser notification helper
  const sendBrowserNotification = useCallback((log: IntrusiLog) => {
    if (notifiedRef.current.has(log.id)) return;
    notifiedRef.current.add(log.id);

    const isCritical =
      log.event_type === 'FORCED_ENTRY_ALARM' ||
      log.event_type === 'UNAUTHORIZED_OPEN';
    const isWarning = log.event_type === 'IMPACT_WARNING';

    if (!isCritical && !isWarning) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      const title = isCritical
        ? '\uD83D\uDEA8 ALARM INTRUSI!'
        : '\u26A0\uFE0F Peringatan Benturan';
      const body = `${eventTypeLabels[log.event_type] || log.event_type} \u2014 ${format(new Date(log.timestamp), 'HH:mm:ss')}`;
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        tag: `intrusi-${log.id}`,
        requireInteraction: isCritical
      });
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Time since last alarm live counter
  useEffect(() => {
    const updateTimer = () => {
      const lastAlarm = logs.find((l) =>
        ['FORCED_ENTRY_ALARM', 'UNAUTHORIZED_OPEN', 'IMPACT_WARNING'].includes(
          l.event_type
        )
      );
      if (lastAlarm) {
        setTimeSinceAlarm(
          formatDistanceToNow(new Date(lastAlarm.timestamp), {
            addSuffix: false,
            locale: idLocale
          })
        );
      } else {
        setTimeSinceAlarm('');
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [logs]);

  // Realtime subscription
  useEffect(() => {
    if (isDemoMode()) return;

    const supabase = createClient();
    const channel = supabase
      .channel('realtime-intrusi')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'intrusi_logs' },
        (payload) => {
          const newLog = payload.new as IntrusiLog;
          newRowIds.current.add(newLog.id);
          setTimeout(() => newRowIds.current.delete(newLog.id), 2200);
          setLogs((currentLogs) => [newLog, ...currentLogs]);
          setLastDataTimestamp(new Date());
          updateDeviceStatus(areaId, 'intrusi', true);
          setAlertDismissed(false);
          sendBrowserNotification(newLog);
          setSummary((s: any) => {
            const newEvent = payload.new as IntrusiLog;
            const newSummary = {
              ...s,
              total_events: s.total_events + 1
            };
            if (
              newEvent.event_type === 'FORCED_ENTRY_ALARM' ||
              newEvent.event_type === 'UNAUTHORIZED_OPEN'
            ) {
              newSummary.alarm_events = s.alarm_events + 1;
              newSummary.unacknowledged = s.unacknowledged + 1;
            }
            if (newEvent.event_type === 'IMPACT_WARNING') {
              newSummary.impact_warnings = s.impact_warnings + 1;
              newSummary.unacknowledged = s.unacknowledged + 1;
            }
            return newSummary;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'intrusi_logs' },
        (payload) => {
          setLogs((currentLogs) =>
            currentLogs.map((log) =>
              log.id === (payload.new as IntrusiLog).id
                ? (payload.new as IntrusiLog)
                : log
            )
          );
          setSummary((s: any) => {
            const oldLog = payload.old as Partial<IntrusiLog>;
            const newLog = payload.new as IntrusiLog;
            const newSummary = { ...s };
            if (
              oldLog.status === 'unacknowledged' &&
              newLog.status !== 'unacknowledged'
            ) {
              newSummary.unacknowledged = Math.max(0, s.unacknowledged - 1);
            } else if (
              oldLog.status !== 'unacknowledged' &&
              newLog.status === 'unacknowledged'
            ) {
              newSummary.unacknowledged = s.unacknowledged + 1;
            }
            return newSummary;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [areaId, updateDeviceStatus, sendBrowserNotification]);

  // Determine device online status based on recent data activity
  const isDeviceOnline = lastDataTimestamp
    ? Date.now() - lastDataTimestamp.getTime() < 5 * 60 * 1000
    : (initialData.logs?.length ?? 0) > 0;

  // Derived values for UI enhancements
  const latestUnacknowledgedAlarm = logs.find(
    (log) =>
      log.status === 'unacknowledged' &&
      ['FORCED_ENTRY_ALARM', 'UNAUTHORIZED_OPEN', 'IMPACT_WARNING'].includes(
        log.event_type
      )
  );

  const showAlertBanner =
    !alertDismissed && summary.unacknowledged > 0 && latestUnacknowledgedAlarm;

  const ackRate =
    summary.total_events > 0
      ? Math.round(
          ((summary.total_events - summary.unacknowledged) /
            summary.total_events) *
            100
        )
      : 100;

  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const dateRangeLabel =
    fromParam && toParam
      ? `${format(new Date(fromParam), 'dd MMM')} - ${format(new Date(toParam), 'dd MMM yyyy')}`
      : 'Semua waktu';

  const goToUnacknowledged = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', 'unacknowledged');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-row justify-between items-center gap-2 pb-2 md:pb-3">
        {deviceName ? (
          <AnimatedPageTitle
            systemType="intrusi"
            areaId={areaId}
            deviceName={deviceName}
          />
        ) : (
          <div /> // Placeholder to keep DatePicker aligned right
        )}
        <DateRangePicker />
      </div>

      {/* Latest Incident Alert Banner (Point 2) */}
      {showAlertBanner && latestUnacknowledgedAlarm && (
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-base border-2 border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/60 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                {summary.unacknowledged} Insiden Belum Ditinjau
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/70 truncate">
                Terakhir:{' '}
                {eventTypeLabels[latestUnacknowledgedAlarm.event_type] ||
                  latestUnacknowledgedAlarm.event_type}
                {' — '}
                {format(
                  new Date(latestUnacknowledgedAlarm.timestamp),
                  'dd/MM/yy HH:mm'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="default"
              size="sm"
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white border-red-700"
              onClick={goToUnacknowledged}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Tinjau Sekarang
            </Button>
            <Button
              variant="neutral"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setAlertDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary Cards (Points 3 + 8) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Event
            </CardTitle>
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">
              {Number(summary.total_events) || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              {dateRangeLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Alarm
            </CardTitle>
            <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-destructive">
              {Number(summary.alarm_events) || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              {dateRangeLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Benturan
            </CardTitle>
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {Number(summary.impact_warnings) || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              {dateRangeLabel}
            </p>
          </CardContent>
        </Card>

        {/* Clickable Belum Ditinjau card */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-md hover:border-orange-400',
            summary.unacknowledged > 0 &&
              'ring-2 ring-orange-400/50 dark:ring-orange-500/30'
          )}
          onClick={goToUnacknowledged}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Belum Ditinjau
            </CardTitle>
            <Bell
              className={cn(
                'h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500',
                summary.unacknowledged > 0 && 'animate-pulse'
              )}
            />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div
              className={cn(
                'text-xl sm:text-2xl font-bold',
                summary.unacknowledged > 0
                  ? 'text-orange-600'
                  : 'text-green-600'
              )}
            >
              {Number(summary.unacknowledged) || 0}
            </div>
            <p className="text-[10px] sm:text-xs mt-0.5 truncate">
              {timeSinceAlarm ? (
                <span className="text-orange-500/80">
                  {timeSinceAlarm} lalu
                </span>
              ) : (
                <span className="text-orange-500/70">Klik untuk filter</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Acknowledgement Rate */}
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Tingkat Tinjau
            </CardTitle>
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div
              className={cn(
                'text-xl sm:text-2xl font-bold',
                ackRate >= 80
                  ? 'text-green-600'
                  : ackRate >= 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
              )}
            >
              {ackRate}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {summary.total_events - summary.unacknowledged}/
              {summary.total_events} ditinjau
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compact Event Distribution Row */}
      {logs.length > 0 &&
        (() => {
          const countMap: Record<string, number> = {};
          for (const log of logs)
            countMap[log.event_type] = (countMap[log.event_type] || 0) + 1;
          const pills: { type: string; label: string; dot: string }[] = [
            {
              type: 'FORCED_ENTRY_ALARM',
              label: 'Paksa Masuk',
              dot: 'bg-red-500'
            },
            {
              type: 'UNAUTHORIZED_OPEN',
              label: 'Tanpa Izin',
              dot: 'bg-red-400'
            },
            { type: 'IMPACT_WARNING', label: 'Benturan', dot: 'bg-amber-500' },
            { type: 'ARM', label: 'Aktivasi', dot: 'bg-green-500' },
            { type: 'DISARM', label: 'Nonaktif', dot: 'bg-gray-400' },
            {
              type: 'BATTERY_LEVEL_CHANGED',
              label: 'Baterai',
              dot: 'bg-orange-400'
            },
            {
              type: 'SIREN_SILENCED',
              label: 'Sirine Mati',
              dot: 'bg-slate-500'
            }
          ].filter((p) => countMap[p.type] > 0);
          if (pills.length === 0) return null;
          return (
            <div className="flex flex-wrap items-center gap-2 px-0.5">
              <span className="text-xs text-muted-foreground shrink-0">
                Distribusi:
              </span>
              {pills.map((p) => (
                <span
                  key={p.type}
                  className="inline-flex items-center gap-1.5 text-xs bg-secondary border border-border rounded-full px-2.5 py-0.5"
                >
                  <span
                    className={cn('h-2 w-2 rounded-full shrink-0', p.dot)}
                  />
                  {p.label}
                  <span className="font-semibold tabular-nums">
                    {countMap[p.type]}
                  </span>
                </span>
              ))}
            </div>
          );
        })()}

      {/* Device Controls */}
      <IntrusiDeviceControls
        areaId={areaId}
        isDeviceOnline={isDeviceOnline}
        onDeviceLoaded={setDeviceName}
      />

      {/* Data Table */}
      <div ref={tableRef}>
        <IntrusiDataTable
          data={logs}
          pagination={pagination}
          onLogUpdate={updateLogLocally}
          highlightIds={newRowIds.current}
        />
      </div>
    </div>
  );
};
