'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getDeviceDetailsByArea,
  sendIntrusiCommand,
  getIntrusiStatus,
  IntrusiStatus,
  IntrusiCommandPayload
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Shield,
  ShieldOff,
  ShieldAlert,
  Volume2,
  VolumeX,
  WifiOff,
  Activity,
  DoorOpen,
  DoorClosed,
  Zap,
  Battery,
  BatteryCharging,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntrusiDeviceControlsProps {
  areaId: string;
  isDeviceOnline?: boolean;
  onDeviceLoaded?: (name: string) => void;
}

export const IntrusiDeviceControls = ({
  areaId,
  isDeviceOnline: isDeviceOnlineProp,
  onDeviceLoaded
}: IntrusiDeviceControlsProps) => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceDbStatus, setDeviceDbStatus] = useState<'Online' | 'Offline'>(
    'Offline'
  );
  const [doorState, setDoorState] = useState<'OPEN' | 'CLOSED' | null>(null);
  const [systemState, setSystemState] = useState<'ARMED' | 'DISARMED' | null>(
    null
  );
  const [sirenStateDb, setSirenStateDb] = useState<
    'ON' | 'COOLDOWN' | 'OFF' | null
  >(null);
  const [powerSource, setPowerSource] = useState<'MAINS' | 'BATTERY' | null>(
    null
  );
  const [vbatVoltage, setVbatVoltage] = useState<number | null>(null);
  const [vbatPct, setVbatPct] = useState<number | null>(null);
  const [intrusiStatus, setIntrusiStatus] = useState<IntrusiStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const supabase = createClient();

  // Fetch device details + intrusi status
  const fetchData = useCallback(async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Get device for this area
      const device = await getDeviceDetailsByArea(
        session.access_token,
        areaId,
        'intrusi'
      );
      if (device) {
        setDeviceId(device.id);
        setDeviceName(device.name);
        if (onDeviceLoaded) onDeviceLoaded(device.name);
        setDeviceDbStatus(device.status);
        if (device.door_state) setDoorState(device.door_state);
        if (device.intrusi_system_state)
          setSystemState(device.intrusi_system_state);
        if (device.siren_state) setSirenStateDb(device.siren_state);
        if (device.power_source) setPowerSource(device.power_source);
        if (device.vbat_voltage != null) setVbatVoltage(device.vbat_voltage);
        if (device.vbat_pct != null) setVbatPct(device.vbat_pct);

        // Get intrusi status
        const status = await getIntrusiStatus(session.access_token, device.id);
        setIntrusiStatus(status);
        // Seed door/system state from intrusi status if device fields are null
        if (!device.door_state && status?.door_state)
          setDoorState(status.door_state);
        if (!device.intrusi_system_state && status?.system_state)
          setSystemState(status.system_state);
      }
    } catch (error) {
      console.error('[IntrusiControls] Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, [areaId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: listen for device table updates (heartbeat → Online/Offline)
  useEffect(() => {
    if (!deviceId) return;

    const deviceChannel = supabase
      .channel(`intrusi-device-status-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `id=eq.${deviceId}`
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.status === 'Online' || newData.status === 'Offline') {
            setDeviceDbStatus(newData.status);
          }
          // Real-time door state from device record (updated by heartbeat/status messages)
          if (newData.door_state) {
            setDoorState(newData.door_state);
          }
          if (newData.intrusi_system_state) {
            setSystemState(newData.intrusi_system_state);
          }
          if (newData.siren_state !== undefined) {
            setSirenStateDb(newData.siren_state);
          }
          if (newData.power_source !== undefined) {
            setPowerSource(newData.power_source);
          }
          if (newData.vbat_voltage !== undefined) {
            setVbatVoltage(newData.vbat_voltage);
          }
          if (newData.vbat_pct !== undefined) {
            setVbatPct(newData.vbat_pct);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deviceChannel);
    };
  }, [supabase, deviceId]);

  // Realtime: listen for new intrusi_logs
  useEffect(() => {
    const channel = supabase
      .channel(`intrusi-controls-${areaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intrusi_logs'
        },
        (payload) => {
          // Refresh status when new events arrive
          if (payload.new && deviceId) {
            const newLog = payload.new as any;
            if (newLog.device_id === deviceId) {
              const isUpdateEvent = payload.eventType === 'UPDATE';

              // When a log status is updated (acknowledged/resolved),
              // re-fetch the full status from backend to recalculate BAHAYA/AMAN
              if (isUpdateEvent) {
                const oldLog = payload.old as any;
                if (oldLog.status !== newLog.status) {
                  // Status changed — re-fetch from backend for accurate overall status
                  (async () => {
                    try {
                      const {
                        data: { session }
                      } = await supabase.auth.getSession();
                      if (session) {
                        const freshStatus = await getIntrusiStatus(
                          session.access_token,
                          deviceId
                        );
                        setIntrusiStatus(freshStatus);
                      }
                    } catch (err) {
                      console.error(
                        '[IntrusiControls] Failed to refresh status:',
                        err
                      );
                    }
                  })();
                  return;
                }
              }

              // Update system_state and door_state from latest event
              setIntrusiStatus((prev) => {
                if (!prev) return prev;
                const updated = { ...prev };

                if (newLog.system_state) {
                  updated.system_state = newLog.system_state;
                  setSystemState(newLog.system_state);
                }
                if (newLog.door_state) {
                  updated.door_state = newLog.door_state;
                  setDoorState(newLog.door_state);
                }

                // Update status based on event type
                if (
                  newLog.event_type === 'FORCED_ENTRY_ALARM' ||
                  newLog.event_type === 'UNAUTHORIZED_OPEN'
                ) {
                  updated.status = 'BAHAYA';
                  updated.latest_alarm = newLog;
                } else if (newLog.event_type === 'IMPACT_WARNING') {
                  if (updated.status !== 'BAHAYA') {
                    updated.status = 'WASPADA';
                  }
                } else if (
                  newLog.event_type === 'ARM' ||
                  newLog.event_type === 'DISARM'
                ) {
                  const newState =
                    newLog.event_type === 'ARM' ? 'ARMED' : 'DISARMED';
                  updated.system_state = newState as any;
                  setSystemState(newState as any);
                  if (newLog.event_type === 'DISARM') {
                    updated.status = 'AMAN';
                  }
                } else if (newLog.event_type === 'SIREN_SILENCED') {
                  // Operator silenced the siren → clear BAHAYA
                  updated.status = 'AMAN';
                } else if (newLog.event_type === 'BATTERY_LEVEL_CHANGED') {
                  // Update battery info from event payload
                  const pl = newLog.payload as Record<string, any> | null;
                  if (pl?.vbat_v !== undefined) setVbatVoltage(pl.vbat_v);
                  if (pl?.vbat_pct !== undefined) setVbatPct(pl.vbat_pct);
                }

                updated.latest_event = newLog;
                return updated;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, areaId, deviceId]);

  // Send command helper
  const handleCommand = async (command: IntrusiCommandPayload) => {
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
      await sendIntrusiCommand(session.access_token, deviceId, command);
      toast.success(`Perintah '${command.cmd}' berhasil dikirim.`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!deviceId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm font-medium">
              Perangkat intrusi tidak ditemukan di area ini.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Pastikan perangkat sudah terpasang dan terkonfigurasi.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isArmed =
    systemState === 'ARMED' || intrusiStatus?.system_state === 'ARMED';
  const isDoorClosed =
    doorState === 'CLOSED' ||
    (doorState === null && intrusiStatus?.door_state === 'CLOSED');
  const isSirenActive = sirenStateDb === 'ON';
  const isSirenCooldown = sirenStateDb === 'COOLDOWN';
  // Use DB device status as primary source (heartbeat-based), fall back to prop
  const isDeviceOnline = deviceDbStatus === 'Online' || isDeviceOnlineProp;
  const isOffline = !isDeviceOnline;

  const statusColor =
    intrusiStatus?.status === 'BAHAYA'
      ? 'text-red-600'
      : intrusiStatus?.status === 'WASPADA'
        ? 'text-yellow-600'
        : 'text-green-600';

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Kontrol Keamanan Pintu</span>
            <span className="sm:hidden">Kontrol Pintu</span>
          </span>
          {isOffline ? (
            <Badge variant="default" className="bg-red-500 text-white">
              <WifiOff className="mr-1 h-3 w-3" /> Offline
            </Badge>
          ) : (
            <Badge
              variant="default"
              className={cn(
                intrusiStatus?.status === 'BAHAYA'
                  ? 'bg-red-500 text-white'
                  : intrusiStatus?.status === 'WASPADA'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-green-500 text-white'
              )}
            >
              <Activity className="mr-1 h-3 w-3" />
              {intrusiStatus?.status || 'N/A'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6">
        {/* Offline Banner (#8) */}
        {isOffline && (
          <div className="flex items-center gap-2 sm:gap-3 rounded-base border-2 border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50 p-2 sm:p-3">
            <div className="relative">
              <WifiOff className="h-5 w-5 text-red-500" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            </div>
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
          {/* Status Indicators — neobrutalist tiles (#3) */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-sm">
              {/* System State */}
              <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-3 transition-colors">
                {isArmed ? (
                  <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
                ) : (
                  <ShieldOff className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Sistem</p>
                  <p
                    className={cn(
                      'font-semibold',
                      isArmed ? 'text-red-600' : ''
                    )}
                  >
                    {isArmed ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
              </div>

              {/* Door State */}
              <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-3 transition-colors">
                {isDoorClosed ? (
                  <DoorClosed className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <DoorOpen className="h-5 w-5 shrink-0 text-orange-500" />
                )}
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Pintu</p>
                  <p
                    className={cn(
                      'font-semibold',
                      !isDoorClosed ? 'text-orange-600' : ''
                    )}
                  >
                    {isDoorClosed ? 'TERTUTUP' : 'TERBUKA'}
                  </p>
                </div>
              </div>

              {/* Siren State */}
              <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-3 transition-colors">
                {isSirenActive ? (
                  <Volume2 className="h-5 w-5 shrink-0 text-red-500 animate-pulse" />
                ) : (
                  <VolumeX className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Sirine</p>
                  <p
                    className={cn(
                      'font-semibold',
                      isSirenActive
                        ? 'text-red-600'
                        : isSirenCooldown
                          ? 'text-yellow-600'
                          : ''
                    )}
                  >
                    {isSirenActive
                      ? 'MENYALA'
                      : isSirenCooldown
                        ? 'COOLDOWN'
                        : 'MATI'}
                  </p>
                </div>
              </div>

              {/* Power Source */}
              <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-3 transition-colors">
                {powerSource === 'MAINS' ? (
                  <Zap className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <Battery className="h-5 w-5 shrink-0 text-yellow-500" />
                )}
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Sumber Daya</p>
                  <p
                    className={cn(
                      'font-semibold truncate',
                      powerSource === 'BATTERY'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    )}
                  >
                    {powerSource === 'MAINS'
                      ? 'ADAPTOR'
                      : powerSource === 'BATTERY'
                        ? 'BATERAI'
                        : '-'}
                  </p>
                </div>
              </div>

              {/* Battery */}
              <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-3 transition-colors">
                <BatteryCharging
                  className={cn(
                    'h-5 w-5 shrink-0',
                    vbatPct == null
                      ? 'text-muted-foreground'
                      : vbatPct >= 60
                        ? 'text-green-500'
                        : vbatPct >= 30
                          ? 'text-yellow-500'
                          : 'text-red-500'
                  )}
                />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Baterai</p>
                  <p
                    className={cn(
                      'font-semibold',
                      vbatPct == null
                        ? ''
                        : vbatPct >= 60
                          ? 'text-green-600'
                          : vbatPct >= 30
                            ? 'text-yellow-600'
                            : 'text-red-600'
                    )}
                  >
                    {vbatPct != null ? `${vbatPct}%` : '-'}
                    {vbatVoltage != null && (
                      <span className="text-muted-foreground ml-1 text-xs font-normal">
                        ({vbatVoltage.toFixed(2)}V)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Last Update — 6th tile (#3) */}
              <div className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary p-3 transition-colors">
                <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">
                    Update Terakhir
                  </p>
                  <p className="font-semibold text-xs">
                    {intrusiStatus?.latest_event?.timestamp
                      ? new Date(
                          intrusiStatus.latest_event.timestamp
                        ).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
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
                {/* ARM / DISARM */}
                <div className="flex gap-2">
                  <Button
                    className="w-full"
                    variant={isArmed ? 'default' : 'reverse'}
                    onClick={() => handleCommand({ cmd: 'ARM' })}
                    disabled={isSending || isArmed}
                  >
                    <Shield className="mr-2 h-4 w-4" /> ARM
                  </Button>
                  <Button
                    className="w-full"
                    variant={!isArmed ? 'default' : 'reverse'}
                    onClick={() => handleCommand({ cmd: 'DISARM' })}
                    disabled={isSending || !isArmed}
                  >
                    <ShieldOff className="mr-2 h-4 w-4" /> DISARM
                  </Button>
                </div>

                {/* Siren Silence — conditional pulse (#1) */}
                <Button
                  className={cn('w-full', !isSirenActive && 'animate-none')}
                  variant={isSirenActive ? 'alert' : 'neutral'}
                  onClick={() =>
                    handleCommand({
                      cmd: 'SIREN_SILENCE',
                      issued_by: 'dashboard'
                    })
                  }
                  disabled={isSending || (!isSirenActive && !isSirenCooldown)}
                >
                  <VolumeX className="mr-2 h-4 w-4" /> Matikan Sirine
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
