/**
 * @file IntrusiStatusBadges.tsx
 * @purpose Reusable status and event type badge components for intrusi logs
 * @usedBy IntrusiDataTable
 * @deps Badge UI
 * @exports StatusBadge, EventTypeBadge, getSeverityColor
 * @sideEffects None
 */

import { Badge } from '@/components/ui/badge';

// --- Status Badge ---
export function StatusBadge({ status }: { status: string }) {
  const getClass = (s: string) => {
    switch (s) {
      case 'resolved':
        return 'bg-green-600 text-white';
      case 'acknowledged':
        return 'bg-blue-600 text-white';
      case 'false_alarm':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-red-600 text-white'; // unacknowledged
    }
  };
  const labels: Record<string, string> = {
    unacknowledged: 'Belum Ditinjau',
    acknowledged: 'Dikonfirmasi',
    resolved: 'Teratasi',
    false_alarm: 'Alarm Palsu'
  };
  return <Badge className={getClass(status)}>{labels[status] || status}</Badge>;
}

// --- Event Type Badge ---
export function EventTypeBadge({ eventType }: { eventType: string }) {
  const getClass = (t: string) => {
    switch (t) {
      case 'FORCED_ENTRY_ALARM':
      case 'UNAUTHORIZED_OPEN':
        return 'bg-red-600 text-white';
      case 'IMPACT_WARNING':
        return 'bg-yellow-600 text-white';
      case 'ARM':
        return 'bg-green-600 text-white';
      case 'BATTERY_LEVEL_CHANGED':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };
  const labels: Record<string, string> = {
    IMPACT_WARNING: 'Peringatan Benturan',
    FORCED_ENTRY_ALARM: 'Alarm Paksa Masuk',
    UNAUTHORIZED_OPEN: 'Buka Tanpa Izin',
    POWER_SOURCE_CHANGED: 'Ganti Daya',
    BATTERY_LEVEL_CHANGED: 'Level Baterai',
    SIREN_SILENCED: 'Sirine Dimatikan',
    ARM: 'Aktivasi Sistem',
    DISARM: 'Penonaktifan Sistem'
  };
  return (
    <Badge className={getClass(eventType)}>
      {labels[eventType] || eventType}
    </Badge>
  );
}

// --- Severity color helper ---
export function getSeverityColor(eventType: string): string {
  switch (eventType) {
    case 'FORCED_ENTRY_ALARM':
    case 'UNAUTHORIZED_OPEN':
      return 'border-l-[3px] border-l-red-500 bg-red-500/[0.03] dark:bg-red-500/[0.06]';
    case 'IMPACT_WARNING':
      return 'border-l-[3px] border-l-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.06]';
    case 'ARM':
    case 'DISARM':
      return 'border-l-[3px] border-l-green-500 bg-green-500/[0.02] dark:bg-green-500/[0.04]';
    case 'BATTERY_LEVEL_CHANGED':
    case 'POWER_SOURCE_CHANGED':
      return 'border-l-[3px] border-l-orange-400 bg-orange-400/[0.02] dark:bg-orange-400/[0.05]';
    default:
      return 'border-l-[3px] border-l-border';
  }
}

// --- Label maps (exported for CSV export and other consumers) ---
export const EVENT_TYPE_LABELS: Record<string, string> = {
  IMPACT_WARNING: 'Peringatan Benturan',
  FORCED_ENTRY_ALARM: 'Alarm Paksa Masuk',
  UNAUTHORIZED_OPEN: 'Buka Tanpa Izin',
  POWER_SOURCE_CHANGED: 'Ganti Daya',
  BATTERY_LEVEL_CHANGED: 'Level Baterai',
  SIREN_SILENCED: 'Sirine Dimatikan',
  ARM: 'Aktivasi Sistem',
  DISARM: 'Penonaktifan Sistem'
};

export const STATUS_LABELS: Record<string, string> = {
  unacknowledged: 'Belum Ditinjau',
  acknowledged: 'Dikonfirmasi',
  resolved: 'Teratasi',
  false_alarm: 'Alarm Palsu'
};
