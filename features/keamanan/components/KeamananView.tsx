/**
 * @file KeamananView.tsx
 * @purpose Main view for keamanan system — data table, chart, incident management
 * @usedBy SystemPage (systemType=keamanan)
 * @deps KeamananDataTable, SecurityStatusChart, lib/api
 * @exports KeamananView
 * @sideEffects API calls for data loading
 */

'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from 'react';
import {
  useParams,
  useRouter,
  useSearchParams,
  usePathname
} from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeamananDataTable } from './KeamananDataTable';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/demo/api-interceptor';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { AnimatedPageTitle } from '@/components/shared/AnimatedPageTitle';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Camera,
  ShieldAlert,
  Eye,
  Bell,
  CheckCircle2,
  Target,
  X
} from 'lucide-react';
import type { KeamananLog } from '@/lib/api';

// ====================================================
// HELPER: Filter atribut confidence > 50%
// ====================================================
function getHighConfidenceAttributes(
  log: KeamananLog
): { attribute: string; confidence: number }[] {
  if (!log.attributes || !Array.isArray(log.attributes)) return [];
  const result: { attribute: string; confidence: number }[] = [];
  for (const person of log.attributes as any[]) {
    const attrs = person.attributes || [person];
    if (!Array.isArray(attrs)) continue;
    for (const a of attrs) {
      const conf = typeof a.confidence === 'number' ? a.confidence : 0;
      if (conf > 0.5 && a.attribute && !a.attribute.includes('not wearing')) {
        result.push({
          attribute: a.attribute
            .replace('person wearing a ', '')
            .replace(' shirt', '')
            .replace(' hat', 'topi')
            .replace(' glasses', 'kacamata'),
          confidence: conf
        });
      }
    }
  }
  return result;
}

// ====================================================
// COMPONENT
// ====================================================
export const KeamananView = ({ initialData }: { initialData: any }) => {
  const params = useParams();
  const areaId = params.areaId as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Hydration guard - only render dynamic content after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [logs, setLogs] = useState<KeamananLog[]>(initialData.logs || []);
  const newRowIds = useRef<Set<string>>(new Set());
  const [summary, setSummary] = useState(
    initialData.summary || {
      total_detections: 0,
      unacknowledged_alerts: 0
    }
  );
  const [pagination, setPagination] = useState(initialData.pagination);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [timeSinceDetection, setTimeSinceDetection] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  // Store the very first log (page 1, index 0) as the "latest" for preview
  const [latestLog, setLatestLog] = useState<KeamananLog | null>(
    initialData.logs?.[0] || null
  );

  // ---- Sync with server data ----
  useEffect(() => {
    setLogs(initialData.logs || []);
    setSummary(
      initialData.summary || { total_detections: 0, unacknowledged_alerts: 0 }
    );
    setPagination(initialData.pagination);
    setAlertDismissed(false);

    const currentPage =
      initialData.pagination?.page || initialData.pagination?.current_page || 1;
    if (currentPage === 1 && initialData.logs?.[0]) {
      setLatestLog(initialData.logs[0]);
    }
  }, [initialData]);

  // ---- Local update ----
  const updateLogLocally = (logId: string, updates: Partial<any>) => {
    setLogs((currentLogs) =>
      currentLogs.map((log) =>
        log.id === logId ? { ...log, ...updates } : log
      )
    );
    if (latestLog && latestLog.id === logId) {
      setLatestLog((prev) => (prev ? { ...prev, ...updates } : prev));
    }
    if (updates.status) {
      setSummary((s: any) => {
        const currentLog = logs.find((l) => l.id === logId);
        if (!currentLog) return s;
        const newSummary = { ...s };
        if (
          currentLog.status === 'unacknowledged' &&
          updates.status !== 'unacknowledged'
        ) {
          newSummary.unacknowledged_alerts = Math.max(
            0,
            s.unacknowledged_alerts - 1
          );
        } else if (
          currentLog.status !== 'unacknowledged' &&
          updates.status === 'unacknowledged'
        ) {
          newSummary.unacknowledged_alerts = s.unacknowledged_alerts + 1;
        }
        return newSummary;
      });
    }
  };

  // ---- Browser notification ----
  const sendBrowserNotification = useCallback((log: KeamananLog) => {
    if (notifiedRef.current.has(log.id)) return;
    notifiedRef.current.add(log.id);
    if ('Notification' in window && Notification.permission === 'granted') {
      const conf =
        typeof log.confidence === 'number' && log.confidence > 0
          ? `${Math.round(log.confidence * 100)}%`
          : '';
      new Notification('🚨 Deteksi Orang!', {
        body: `Confidence: ${conf} — ${format(new Date(log.created_at), 'HH:mm:ss')}`,
        icon: '/icon-192x192.png',
        tag: `keamanan-${log.id}`,
        requireInteraction: true
      });
    }
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ---- Timer since last detection ----
  useEffect(() => {
    if (!mounted) return;
    const updateTimer = () => {
      if (latestLog) {
        setTimeSinceDetection(
          formatDistanceToNow(new Date(latestLog.created_at), {
            addSuffix: false,
            locale: idLocale
          })
        );
      } else {
        setTimeSinceDetection('');
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [latestLog, mounted]);

  // ---- Realtime ----
  useEffect(() => {
    if (isDemoMode()) return;

    const supabase = createClient();
    const channel = supabase
      .channel('realtime-keamanan')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'keamanan_logs' },
        (payload) => {
          const newLog = payload.new as KeamananLog;
          newRowIds.current.add(newLog.id);
          setTimeout(() => newRowIds.current.delete(newLog.id), 2200);
          setLogs((currentLogs) => [newLog, ...currentLogs]);
          setLatestLog(newLog);
          setAlertDismissed(false);
          sendBrowserNotification(newLog);
          setSummary((s: any) => ({
            ...s,
            total_detections: s.total_detections + 1,
            unacknowledged_alerts: s.unacknowledged_alerts + 1
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'keamanan_logs' },
        (payload) => {
          setLogs(
            (currentLogs) =>
              currentLogs.map((log) =>
                log.id === payload.new.id ? payload.new : log
              ) as KeamananLog[]
          );
          setLatestLog((prev) => {
            if (prev && prev.id === payload.new.id)
              return payload.new as KeamananLog;
            return prev;
          });
          setSummary((s: any) => {
            const oldLog = payload.old;
            const newLog = payload.new;
            const newSummary = { ...s };
            if (
              oldLog.status === 'unacknowledged' &&
              newLog.status !== 'unacknowledged'
            ) {
              newSummary.unacknowledged_alerts = Math.max(
                0,
                s.unacknowledged_alerts - 1
              );
            } else if (
              oldLog.status !== 'unacknowledged' &&
              newLog.status === 'unacknowledged'
            ) {
              newSummary.unacknowledged_alerts = s.unacknowledged_alerts + 1;
            }
            return newSummary;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [areaId, sendBrowserNotification]);

  // ---- Derived values ----
  const avgConfidence = useMemo(() => {
    const withConf = logs.filter(
      (l) =>
        typeof l.confidence === 'number' &&
        !isNaN(l.confidence) &&
        l.confidence > 0
    );
    if (withConf.length === 0) return null;
    const sum = withConf.reduce((acc, l) => acc + (l.confidence as number), 0);
    return Math.round((sum / withConf.length) * 100);
  }, [logs]);

  const ackRate = useMemo(() => {
    const total = summary.total_detections || 0;
    const unack = summary.unacknowledged_alerts || 0;
    if (total === 0) return 100;
    return Math.round(((total - unack) / total) * 100);
  }, [summary]);

  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const dateRangeLabel =
    fromParam && toParam
      ? `${format(new Date(fromParam), 'dd MMM')} - ${format(new Date(toParam), 'dd MMM yyyy')}`
      : 'Semua waktu';

  const showAlertBanner = !alertDismissed && summary.unacknowledged_alerts > 0;
  const latestUnack = logs.find((l) => l.status === 'unacknowledged');

  const goToUnacknowledged = () => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('status', 'unacknowledged');
    p.set('page', '1');
    router.push(`${pathname}?${p.toString()}`);
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const previewAttributes = useMemo(() => {
    if (!latestLog) return [];
    return getHighConfidenceAttributes(latestLog);
  }, [latestLog]);

  // Helper to safely format dates only on client
  const formatDate = (dateStr: string, fmt: string) => {
    if (!mounted) return '';
    try {
      return format(new Date(dateStr), fmt);
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header + Date Picker */}
      <div className="flex flex-row justify-between items-center gap-2 pb-2 md:pb-3">
        <AnimatedPageTitle systemType="keamanan" areaId={areaId} />
        <DateRangePicker />
      </div>

      {/* ============================================ */}
      {/* ALERT BANNER                                 */}
      {/* ============================================ */}
      {mounted && showAlertBanner && latestUnack && (
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-base border-2 border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/60 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                {summary.unacknowledged_alerts} Deteksi Belum Ditinjau
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/70 truncate">
                Terakhir: {formatDate(latestUnack.created_at, 'dd/MM/yy HH:mm')}
                {typeof latestUnack.confidence === 'number' &&
                  latestUnack.confidence > 0 &&
                  ` — Confidence: ${Math.round(latestUnack.confidence * 100)}%`}
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

      {/* ============================================ */}
      {/* LATEST PHOTO PREVIEW BOX                     */}
      {/* ============================================ */}
      {latestLog && (
        <Card className="overflow-hidden">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4 shrink-0" />
              <span>Deteksi Terbaru</span>
              {mounted && (
                <span className="text-xs text-muted-foreground font-normal ml-auto shrink-0">
                  {formatDate(latestLog.created_at, 'dd MMM yyyy, HH:mm:ss')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Image - takes 2 cols on md */}
              <div className="md:col-span-2">
                <a
                  href={latestLog.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={latestLog.image_url}
                    alt="Deteksi Keamanan"
                    className="rounded-md border-2 border-border w-full max-h-72 object-contain bg-black/5"
                  />
                </a>
              </div>

              {/* Info side */}
              <div className="md:col-span-1 flex flex-col gap-3 min-w-0">
                <div className="rounded-base border-2 border-border p-3 overflow-hidden">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      typeof latestLog.confidence === 'number' &&
                        latestLog.confidence > 0.8
                        ? 'text-green-600'
                        : typeof latestLog.confidence === 'number' &&
                            latestLog.confidence > 0.5
                          ? 'text-yellow-600'
                          : 'text-muted-foreground'
                    )}
                  >
                    {typeof latestLog.confidence === 'number' &&
                    latestLog.confidence > 0
                      ? `${Math.round(latestLog.confidence * 100)}%`
                      : '-'}
                  </p>
                </div>

                <div className="rounded-base border-2 border-border p-3 overflow-hidden">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p
                    className={cn(
                      'text-sm font-bold capitalize break-words',
                      latestLog.status === 'unacknowledged'
                        ? 'text-red-600'
                        : latestLog.status === 'acknowledged'
                          ? 'text-blue-600'
                          : latestLog.status === 'resolved'
                            ? 'text-green-600'
                            : 'text-gray-600'
                    )}
                  >
                    {latestLog.status.replace('_', ' ')}
                  </p>
                </div>

                {previewAttributes.length > 0 && (
                  <div className="rounded-base border-2 border-border p-3 overflow-hidden">
                    <p className="text-xs text-muted-foreground mb-2">
                      Atribut Terdeteksi
                    </p>
                    <div className="space-y-1.5">
                      {previewAttributes.map((attr, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="capitalize text-sm truncate">
                            {attr.attribute}
                          </span>
                          <span
                            className={cn(
                              'text-xs font-semibold shrink-0 tabular-nums',
                              attr.confidence > 0.8
                                ? 'text-green-600'
                                : 'text-yellow-600'
                            )}
                          >
                            {Math.round(attr.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {latestLog.notes && (
                  <div className="rounded-base border-2 border-border p-3 overflow-hidden">
                    <p className="text-xs text-muted-foreground mb-1">
                      Catatan
                    </p>
                    <p className="text-sm break-words">{latestLog.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* SUMMARY CARDS - 4 Cards                      */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Deteksi
            </CardTitle>
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold">
              {summary.total_detections}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              {dateRangeLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Avg. Confidence
            </CardTitle>
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div
              className={cn(
                'text-xl sm:text-2xl font-bold',
                avgConfidence === null
                  ? 'text-muted-foreground'
                  : avgConfidence >= 80
                    ? 'text-green-600'
                    : avgConfidence >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
              )}
            >
              {avgConfidence !== null ? `${avgConfidence}%` : '-'}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              YOLOv8 Detection
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-md hover:border-orange-400',
            summary.unacknowledged_alerts > 0 &&
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
                summary.unacknowledged_alerts > 0 && 'animate-pulse'
              )}
            />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div
              className={cn(
                'text-xl sm:text-2xl font-bold',
                summary.unacknowledged_alerts > 0
                  ? 'text-orange-600'
                  : 'text-green-600'
              )}
            >
              {summary.unacknowledged_alerts}
            </div>
            <p className="text-[10px] sm:text-xs mt-0.5 truncate">
              {mounted && timeSinceDetection ? (
                <span className="text-orange-500/80">
                  {timeSinceDetection} lalu
                </span>
              ) : (
                <span className="text-orange-500/70">Klik untuk filter</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
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
              {summary.total_detections - summary.unacknowledged_alerts}/
              {summary.total_detections} ditinjau
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* DATA TABLE                                    */}
      {/* ============================================ */}
      <div ref={tableRef}>
        <KeamananDataTable
          data={logs}
          pagination={pagination}
          onLogUpdate={updateLogLocally}
          highlightIds={newRowIds.current}
        />
      </div>
    </div>
  );
};
