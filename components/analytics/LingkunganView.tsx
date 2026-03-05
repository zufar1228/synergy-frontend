'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { createClient } from '@/lib/supabase/client';
import { useDeviceStatus } from '@/contexts/DeviceStatusContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Thermometer,
  Droplets,
  Wind,
  Fan,
  Activity,
  WifiOff,
  TrendingUp,
  Clock,
  ToggleLeft,
  ToggleRight,
  Gauge
} from 'lucide-react';
import {
  getDeviceDetailsByArea,
  sendLingkunganControl,
  getLingkunganStatus,
  getLingkunganChart,
  type LingkunganStatus
} from '@/lib/api';
import { LingkunganChart } from './LingkunganChart';
import { LingkunganDataTable } from './LingkunganDataTable';
import type { LingkunganLog } from '@/lib/api';

export const LingkunganView = ({ initialData }: { initialData: any }) => {
  const params = useParams();
  const areaId = params.areaId as string;
  const { updateDeviceStatus } = useDeviceStatus();

  const [logs, setLogs] = useState<LingkunganLog[]>(initialData.logs || []);
  const newRowIds = useRef<Set<string>>(new Set());
  const [summary, setSummary] = useState({
    total_readings: 0,
    unacknowledged: 0,
    ...initialData.summary
  });
  const [pagination, setPagination] = useState(initialData.pagination);
  const [lastDataTimestamp, setLastDataTimestamp] = useState<Date | null>(null);

  // Device state
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceDbStatus, setDeviceDbStatus] = useState<'Online' | 'Offline'>(
    'Offline'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Control state
  const [fanState, setFanState] = useState<string>('OFF');
  const [dehumidifierState, setDehumidifierState] = useState<string>('OFF');
  const [controlMode, setControlMode] = useState<string>('AUTO');
  const [overrideUntil, setOverrideUntil] = useState<string | null>(null);

  // Latest readings & predictions
  const [latestReading, setLatestReading] = useState<{
    temperature: number;
    humidity: number;
    co2: number;
    timestamp: string;
  } | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<{
    predicted_temperature: number;
    predicted_humidity: number;
    predicted_co2: number;
    timestamp: string;
  } | null>(null);
  const [envStatus, setEnvStatus] = useState<'NORMAL' | 'WASPADA' | 'BAHAYA'>(
    'NORMAL'
  );

  // Chart data
  const [chartActual, setChartActual] = useState<any[]>([]);
  const [chartPredictions, setChartPredictions] = useState<any[]>([]);

  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const supabase = createClient();

  // Fetch device info & status
  const fetchData = useCallback(async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const device = await getDeviceDetailsByArea(
        session.access_token,
        areaId,
        'lingkungan'
      );
      if (device) {
        setDeviceId(device.id);
        setDeviceName(device.name);
        setDeviceDbStatus(device.status);

        const status = await getLingkunganStatus(
          session.access_token,
          device.id
        );
        if (status) {
          setFanState(status.fan_state);
          setDehumidifierState(status.dehumidifier_state);
          setControlMode(status.control_mode);
          setOverrideUntil(status.manual_override_until);
          setEnvStatus(status.status);
          if (status.latest_reading) setLatestReading(status.latest_reading);
          if (status.latest_prediction)
            setLatestPrediction(status.latest_prediction);
        }
      }
    } catch (error) {
      console.error('[LingkunganView] Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, [areaId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize from server data
  useEffect(() => {
    // make sure logs are newest-first (descending) before using them
    const sortedLogs = (initialData.logs || [])
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    setLogs(sortedLogs);
    setSummary({
      total_readings: 0,
      unacknowledged: 0,
      ...initialData.summary
    });
    if (sortedLogs.length > 0) {
      setLastDataTimestamp(new Date(sortedLogs[0].timestamp));
    }
  }, [initialData]);

  // fetch chart data when device or date range changes
  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;

    // clear previous chart while loading new range
    setChartActual([]);
    setChartPredictions([]);

    (async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      try {
        // request limit 200 to give us room for trimming to 120 later
        const res = await getLingkunganChart(
          session.access_token,
          deviceId,
          fromParam || undefined,
          toParam || undefined,
          200
        );
        if (!res || cancelled) return;

        // backend returns { data: { actual: [...], predictions: [...] } }
        let { actual = [], predictions = [] } = res.data || {};

        console.log('[LingkunganView] Chart data received:', {
          actualCount: actual.length,
          predictCount: predictions.length,
          firstActual: actual[0]?.timestamp,
          lastActual: actual[actual.length - 1]?.timestamp,
          firstPred: predictions[0]?.timestamp,
          lastPred: predictions[predictions.length - 1]?.timestamp
        });

        // ensure chronological order regardless of backend
        const sortByTime = (arr: any[]) =>
          arr
            .slice()
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            );

        actual = sortByTime(actual);
        predictions = sortByTime(predictions);

        const toPoint = (a: any) => ({
          timestamp: a.timestamp,
          time: new Date(a.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          temperature: a.temperature,
          humidity: a.humidity,
          co2: a.co2
        });
        const toPred = (p: any) => ({
          timestamp: p.timestamp,
          time: new Date(p.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          predicted_temperature: p.predicted_temperature,
          predicted_humidity: p.predicted_humidity,
          predicted_co2: p.predicted_co2
        });

        const chartsActual = actual.map(toPoint).slice(-120);
        const chartsPred = predictions.map(toPred).slice(-120);

        console.log('[LingkunganView] After sort+slice:', {
          chartActualCount: chartsActual.length,
          chartPredCount: chartsPred.length,
          firstChartActual: chartsActual[0]?.timestamp,
          lastChartActual: chartsActual[chartsActual.length - 1]?.timestamp
        });

        setChartActual(chartsActual);
        setChartPredictions(chartsPred);
      } catch (err) {
        console.error('[LingkunganView] failed to fetch chart data', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deviceId, fromParam, toParam, supabase]);

  // Realtime subscription for sensor data
  useEffect(() => {
    const channel = supabase
      .channel('realtime-lingkungan')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lingkungan_logs' },
        (payload) => {
          const newLog = payload.new as LingkunganLog;
          newRowIds.current.add(newLog.id);
          setTimeout(() => newRowIds.current.delete(newLog.id), 2200);
          setLogs((currentLogs) => [newLog, ...currentLogs]);
          setLastDataTimestamp(new Date());
          updateDeviceStatus(areaId, 'lingkungan', true);
          setSummary((s: any) => ({
            ...s,
            total_readings: s.total_readings + 1
          }));

          // Update latest reading
          setLatestReading({
            temperature: newLog.temperature,
            humidity: newLog.humidity,
            co2: newLog.co2,
            timestamp: newLog.timestamp
          });

          // Add to chart
          setChartActual((prev) =>
            [
              ...prev,
              {
                timestamp: newLog.timestamp,
                time: new Date(newLog.timestamp).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                temperature: newLog.temperature,
                humidity: newLog.humidity,
                co2: newLog.co2
              }
            ].slice(-120)
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lingkungan_logs' },
        (payload) => {
          setLogs((currentLogs) =>
            currentLogs.map((log) =>
              log.id === (payload.new as LingkunganLog).id
                ? (payload.new as LingkunganLog)
                : log
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [areaId, updateDeviceStatus, supabase]);

  // Realtime subscription for predictions
  useEffect(() => {
    const predChannel = supabase
      .channel('realtime-predictions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'prediction_results' },
        (payload) => {
          const pred = payload.new as any;
          setLatestPrediction({
            predicted_temperature: pred.predicted_temperature,
            predicted_humidity: pred.predicted_humidity,
            predicted_co2: pred.predicted_co2,
            timestamp: pred.timestamp
          });

          setChartPredictions((prev) =>
            [
              ...prev,
              {
                timestamp: pred.timestamp,
                time: new Date(pred.timestamp).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                predicted_temperature: pred.predicted_temperature,
                predicted_humidity: pred.predicted_humidity,
                predicted_co2: pred.predicted_co2
              }
            ].slice(-120)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(predChannel);
    };
  }, [supabase]);

  // Realtime device status
  useEffect(() => {
    if (!deviceId) return;

    const deviceChannel = supabase
      .channel(`lingkungan-device-status-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `id=eq.${deviceId}`
        },
        (payload) => {
          const d = payload.new as any;
          if (d.status) setDeviceDbStatus(d.status);
          if (d.fan_state) setFanState(d.fan_state);
          if (d.dehumidifier_state) setDehumidifierState(d.dehumidifier_state);
          if (d.control_mode) setControlMode(d.control_mode);
          if (d.manual_override_until !== undefined)
            setOverrideUntil(d.manual_override_until);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deviceChannel);
    };
  }, [supabase, deviceId]);

  // Send control command
  const handleControl = async (command: {
    fan?: string;
    dehumidifier?: string;
    mode?: string;
  }) => {
    if (!deviceId) return;
    setIsSending(true);

    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Sesi tidak valid.');
      setIsSending(false);
      return;
    }

    try {
      await sendLingkunganControl(session.access_token, deviceId, command);
      toast.success('Perintah berhasil dikirim.');

      if (command.fan) setFanState(command.fan);
      if (command.dehumidifier) setDehumidifierState(command.dehumidifier);
      if (command.mode) setControlMode(command.mode);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  const isDeviceOnline =
    deviceDbStatus === 'Online' ||
    (lastDataTimestamp
      ? Date.now() - lastDataTimestamp.getTime() < 5 * 60 * 1000
      : false);
  const isOffline = !isDeviceOnline;
  const isManualMode = controlMode === 'MANUAL';

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-end">
        <DateRangePicker />
      </div>

      {/* Real-time Sensor Widgets (3 units) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Temperature Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Suhu
            </CardTitle>
            <Thermometer className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">
              {latestReading
                ? `${latestReading.temperature.toFixed(1)}°C`
                : '--'}
            </div>
            {latestPrediction && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                Prediksi 15m:{' '}
                <span className="font-medium text-green-600">
                  {latestPrediction.predicted_temperature.toFixed(1)}°C
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Humidity Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Kelembapan
            </CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">
              {latestReading ? `${latestReading.humidity.toFixed(1)}%` : '--'}
            </div>
            {latestPrediction && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                Prediksi 15m:{' '}
                <span className="font-medium text-green-600">
                  {latestPrediction.predicted_humidity.toFixed(1)}%
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* CO2 Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">
              CO₂
            </CardTitle>
            <Wind className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-2xl sm:text-3xl font-bold">
              {latestReading ? `${latestReading.co2.toFixed(0)} ppm` : '--'}
            </div>
            {latestPrediction && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                Prediksi 15m:{' '}
                <span className="font-medium text-green-600">
                  {latestPrediction.predicted_co2.toFixed(0)} ppm
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Controls */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            <span className="flex items-center gap-2">
              <Gauge className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">
                Kontrol Lingkungan Gudang
              </span>
              <span className="sm:hidden">Kontrol</span>
            </span>
            <div className="flex items-center gap-2">
              {isOffline ? (
                <Badge variant="default" className="bg-red-500 text-white">
                  <WifiOff className="mr-1 h-3 w-3" /> Offline
                </Badge>
              ) : (
                <Badge
                  variant="default"
                  className={cn(
                    envStatus === 'BAHAYA'
                      ? 'bg-red-500 text-white'
                      : envStatus === 'WASPADA'
                        ? 'bg-yellow-500 text-black'
                        : 'bg-green-500 text-white'
                  )}
                >
                  <Activity className="mr-1 h-3 w-3" />
                  {envStatus}
                </Badge>
              )}
              <Badge
                variant="neutral"
                className={cn(
                  isManualMode
                    ? 'border-orange-500 text-orange-600'
                    : 'border-green-500 text-green-600'
                )}
              >
                {isManualMode ? (
                  <>
                    <ToggleRight className="mr-1 h-3 w-3" /> MANUAL
                  </>
                ) : (
                  <>
                    <ToggleLeft className="mr-1 h-3 w-3" /> AUTO
                  </>
                )}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6">
          {isOffline && (
            <div className="flex items-center gap-2 sm:gap-3 rounded-base border-2 border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50 p-2 sm:p-3">
              <WifiOff className="h-5 w-5 text-red-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Perangkat Offline
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/60">
                  Perangkat tidak merespons. Periksa koneksi jaringan dan daya
                  perangkat.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:gap-6">
            {/* Status Indicators */}
            <div className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-sm">
                {/* Fan Status */}
                <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-3">
                  <Fan
                    className={cn(
                      'h-5 w-5 shrink-0',
                      fanState === 'ON'
                        ? 'text-blue-500 animate-spin'
                        : 'text-muted-foreground'
                    )}
                    style={
                      fanState === 'ON'
                        ? { animationDuration: '1.5s' }
                        : undefined
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">Kipas</p>
                    <p
                      className={cn(
                        'font-semibold',
                        fanState === 'ON' ? 'text-blue-600' : ''
                      )}
                    >
                      {fanState === 'ON' ? 'MENYALA' : 'MATI'}
                    </p>
                  </div>
                </div>

                {/* Dehumidifier Status */}
                <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-3">
                  <Droplets
                    className={cn(
                      'h-5 w-5 shrink-0',
                      dehumidifierState === 'ON'
                        ? 'text-cyan-500'
                        : 'text-muted-foreground'
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">
                      Dehumidifier
                    </p>
                    <p
                      className={cn(
                        'font-semibold',
                        dehumidifierState === 'ON' ? 'text-cyan-600' : ''
                      )}
                    >
                      {dehumidifierState === 'ON' ? 'MENYALA' : 'MATI'}
                    </p>
                  </div>
                </div>

                {/* Last Update */}
                <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-3">
                  <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">
                      Update Terakhir
                    </p>
                    <p className="font-semibold text-xs">
                      {latestReading?.timestamp
                        ? new Date(latestReading.timestamp).toLocaleTimeString(
                            'id-ID',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            }
                          )
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="lg:w-64 xl:w-72 mt-4 lg:mt-0">
              {isOffline ? (
                <div className="flex h-full items-center justify-center gap-2 rounded-base border-2 border-dashed border-red-300 dark:border-red-800 p-4 text-red-500">
                  <WifiOff className="h-5 w-5" />
                  <span className="font-medium">Kontrol Tidak Tersedia</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Fan Toggle */}
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-base border-2 border-border bg-secondary p-3',
                      !isManualMode && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Fan className="h-4 w-4" />
                      <span className="text-sm font-medium">Kipas</span>
                    </div>
                    <Switch
                      checked={fanState === 'ON'}
                      onCheckedChange={(checked) =>
                        handleControl({ fan: checked ? 'ON' : 'OFF' })
                      }
                      disabled={isSending || !isManualMode}
                    />
                  </div>

                  {/* Dehumidifier Toggle */}
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-base border-2 border-border bg-secondary p-3',
                      !isManualMode && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      <span className="text-sm font-medium">Dehumidifier</span>
                    </div>
                    <Switch
                      checked={dehumidifierState === 'ON'}
                      onCheckedChange={(checked) =>
                        handleControl({
                          dehumidifier: checked ? 'ON' : 'OFF'
                        })
                      }
                      disabled={isSending || !isManualMode}
                    />
                  </div>

                  {!isManualMode && (
                    <p className="text-xs text-center text-muted-foreground">
                      Aktifkan mode manual untuk mengontrol aktuator.
                    </p>
                  )}

                  {/* Mode Toggle */}
                  <Button
                    className="w-full"
                    variant={isManualMode ? 'neutral' : 'default'}
                    onClick={() =>
                      handleControl({
                        mode: isManualMode ? 'AUTO' : 'MANUAL'
                      })
                    }
                    disabled={isSending}
                  >
                    {isManualMode ? (
                      <>
                        <ToggleLeft className="mr-2 h-4 w-4" /> Aktifkan Mode
                        Otomatis
                      </>
                    ) : (
                      <>
                        <ToggleRight className="mr-2 h-4 w-4" /> Aktifkan Mode
                        Manual
                      </>
                    )}
                  </Button>

                  {isManualMode && overrideUntil && (
                    <p className="text-xs text-center text-muted-foreground">
                      Mode manual berakhir:{' '}
                      {new Date(overrideUntil).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Chart: Actual vs Predicted */}
      <LingkunganChart
        actualData={chartActual}
        predictionData={chartPredictions}
        logs={logs}
      />

      {/* Data Table */}
      <LingkunganDataTable
        data={logs}
        pagination={pagination}
        highlightIds={newRowIds.current}
      />
    </div>
  );
};
