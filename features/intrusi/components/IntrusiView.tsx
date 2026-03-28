'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IntrusiDataTable } from './IntrusiDataTable';
import { IntrusiDeviceControls } from './IntrusiDeviceControls';
import { createClient } from '@/lib/supabase/client';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { IntrusiLog } from '@/lib/api';
import { useDeviceStatus } from '@/contexts/DeviceStatusContext';
import { ShieldAlert, AlertTriangle, Bell, Activity } from 'lucide-react';
import { AnimatedPageTitle } from '@/components/shared/AnimatedPageTitle';

export const IntrusiView = ({ initialData }: { initialData: any }) => {
  const params = useParams();
  const areaId = params.areaId as string;
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

  useEffect(() => {
    setLogs(initialData.logs || []);
    setSummary({
      total_events: 0,
      alarm_events: 0,
      impact_warnings: 0,
      unacknowledged: 0,
      ...initialData.summary
    });
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

  // Realtime subscription
  useEffect(() => {
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
  }, [areaId, updateDeviceStatus]);

  // Determine device online status based on recent data activity
  const isDeviceOnline = lastDataTimestamp
    ? Date.now() - lastDataTimestamp.getTime() < 5 * 60 * 1000
    : (initialData.logs?.length ?? 0) > 0;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-row justify-between items-center gap-2 pb-2 md:pb-3">
        {deviceName ? (
          <AnimatedPageTitle systemType="intrusi" areaId={areaId} deviceName={deviceName} />
        ) : (
          <div /> // Placeholder to keep DatePicker aligned right
        )}
        <DateRangePicker />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Belum Ditinjau
            </CardTitle>
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {Number(summary.unacknowledged) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Controls */}
      <IntrusiDeviceControls 
        areaId={areaId} 
        isDeviceOnline={isDeviceOnline} 
        onDeviceLoaded={setDeviceName}
      />

      {/* Data Table */}
      <IntrusiDataTable
        data={logs}
        pagination={pagination}
        onLogUpdate={updateLogLocally}
        highlightIds={newRowIds.current}
      />
    </div>
  );
};
