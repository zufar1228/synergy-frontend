'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  getExpandedRowModel,
  ExpandedState
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DoorOpen,
  DoorClosed,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  Filter,
  Download,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Pencil,
  Eye,
  CheckCheck,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  IntrusiLog,
  UpdateIncidentStatusPayload,
  updateIntrusiLogStatus
} from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// --- Review Form Schema ---
const formSchema = z.object({
  status: z.enum(['acknowledged', 'resolved', 'false_alarm']),
  notes: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

// --- Expandable Review Form ---
function ExpandableReviewForm({
  log,
  onLogUpdate
}: {
  log: IntrusiLog;
  onLogUpdate: (logId: string, updates: Partial<IntrusiLog>) => void;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status:
        log.status === 'unacknowledged' ? 'acknowledged' : (log.status as any),
      notes: log.notes || ''
    }
  });

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Sesi tidak valid');

      await updateIntrusiLogStatus(
        log.id,
        values as UpdateIncidentStatusPayload,
        session.access_token
      );

      onLogUpdate(log.id, {
        status: values.status as any,
        notes: values.notes || null
      });
      toast.success('Status log intrusi berhasil diperbarui.');
    } catch (error) {
      toast.error('Gagal memperbarui status.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="p-4 space-y-4 bg-muted/50 rounded-md"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="acknowledged">Dikonfirmasi</SelectItem>
                    <SelectItem value="resolved">Teratasi</SelectItem>
                    <SelectItem value="false_alarm">Alarm Palsu</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tambahkan catatan..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </form>
    </Form>
  );
}

// --- Status Badge ---
function StatusBadge({ status }: { status: string }) {
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
function EventTypeBadge({ eventType }: { eventType: string }) {
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
function getSeverityColor(eventType: string): string {
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

// --- Column definitions ---
function getColumns(
  onLogUpdate: (logId: string, updates: Partial<IntrusiLog>) => void,
  selectedIds: Set<string>,
  toggleSelect: (id: string) => void,
  toggleSelectAll: (ids: string[]) => void,
  allSelected: boolean
): ColumnDef<IntrusiLog>[] {
  return [
    {
      id: 'select',
      meta: { className: 'hidden sm:table-cell' },
      header: ({ table }) => {
        const unackRows = table
          .getRowModel()
          .rows.filter((r) => r.original.status === 'unacknowledged');
        if (unackRows.length === 0) return null;
        return (
          <Checkbox
            checked={allSelected && unackRows.length > 0}
            onCheckedChange={() =>
              toggleSelectAll(unackRows.map((r) => r.original.id))
            }
            aria-label="Pilih semua"
            className="rounded-[3px] h-3.5 w-3.5"
          />
        );
      },
      cell: ({ row }) => {
        if (row.original.status !== 'unacknowledged') return null;
        return (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleSelect(row.original.id)}
            aria-label="Pilih baris"
            className="rounded-[3px] h-3.5 w-3.5"
          />
        );
      }
    },
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="neutral"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => row.toggleExpanded()}
        >
          {row.getIsExpanded() ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />
    },
    {
      accessorKey: 'event_type',
      header: 'Jenis Event',
      cell: ({ row }) => <EventTypeBadge eventType={row.original.event_type} />
    },
    {
      accessorKey: 'system_state',
      header: 'State Sistem',
      meta: { className: '' },
      cell: ({ row }) => {
        const state = row.original.system_state;
        return (
          <div className="flex items-center gap-1">
            {state === 'ARMED' ? (
              <ShieldCheck className="h-4 w-4 text-green-500" />
            ) : (
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{state === 'ARMED' ? 'Aktif' : 'Nonaktif'}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'door_state',
      header: 'Pintu',
      meta: { className: '' },
      cell: ({ row }) => {
        const state = row.original.door_state;
        return (
          <div className="flex items-center gap-1">
            {state === 'CLOSED' ? (
              <DoorClosed className="h-4 w-4 text-green-500" />
            ) : (
              <DoorOpen className="h-4 w-4 text-destructive" />
            )}
            <span>{state === 'CLOSED' ? 'Tertutup' : 'Terbuka'}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'peak_delta_g',
      header: 'Peak ΔG',
      meta: { className: '' },
      cell: ({ row }) => {
        const val = row.original.peak_delta_g;
        if (val == null)
          return <span className="text-muted-foreground">-</span>;
        return <span>{val.toFixed(2)} g</span>;
      }
    },
    {
      accessorKey: 'hit_count',
      header: 'Anomali (Window)',
      meta: { className: '' },
      cell: ({ row }) => {
        // Windowed threshold: read anomaly_count from payload
        const payload = row.original.payload;
        const anomalyCount = payload?.anomaly_count;
        const windowThreshold = payload?.window_threshold ?? 3;
        const hitCount = row.original.hit_count;

        if (anomalyCount != null) {
          const count = Number(anomalyCount);
          return (
            <div className="flex items-center gap-1">
              {count >= windowThreshold && (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              )}
              <span>
                {count} / {windowThreshold}
              </span>
            </div>
          );
        }

        // Legacy fallback for old events with hit_count
        if (hitCount != null) {
          return (
            <div className="flex items-center gap-1">
              {hitCount >= 3 && (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              )}
              <span>{hitCount}</span>
            </div>
          );
        }

        return <span className="text-muted-foreground">-</span>;
      }
    },
    {
      accessorKey: 'timestamp',
      header: 'Waktu',
      cell: ({ row }) => {
        const date = new Date(row.original.timestamp);
        return (
          <>
            <span className="sm:hidden text-xs">
              {format(date, 'dd/MM HH:mm')}
            </span>
            <span className="hidden sm:inline">
              {format(date, 'dd/MM/yy HH:mm:ss')}
            </span>
          </>
        );
      }
    },
    {
      accessorKey: 'notes',
      header: 'Catatan',
      meta: { className: '' },
      cell: ({ row }) => {
        const notes = row.original.notes;
        if (!notes) return <span className="text-muted-foreground">-</span>;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 text-sm text-muted-foreground max-w-[140px] truncate cursor-help">
                  <MessageSquare className="h-3 w-3 shrink-0" />
                  {notes}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="text-sm">{notes}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const isUnack = row.original.status === 'unacknowledged';
        return (
          <Button
            variant={isUnack ? 'default' : 'neutral'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => row.toggleExpanded()}
          >
            {isUnack ? (
              <>
                <Eye className="mr-1 h-3 w-3 sm:mr-1.5" />
                <span className="hidden sm:inline">Tinjau</span>
              </>
            ) : (
              <>
                <Pencil className="mr-1 h-3 w-3 sm:mr-1.5" />
                <span className="hidden sm:inline">Edit</span>
              </>
            )}
          </Button>
        );
      }
    }
  ];
}

// --- Main Component ---
interface IntrusiDataTableProps {
  data: IntrusiLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  onLogUpdate: (logId: string, updates: Partial<IntrusiLog>) => void;
  highlightIds?: Set<string>;
}

export function IntrusiDataTable({
  data,
  pagination,
  onLogUpdate,
  highlightIds
}: IntrusiDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isBulkSubmitting, setIsBulkSubmitting] = React.useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const toggleSelect = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = React.useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allChecked = ids.every((id) => prev.has(id));
      if (allChecked) return new Set();
      return new Set(ids);
    });
  }, []);

  const unackIds = React.useMemo(
    () => data.filter((d) => d.status === 'unacknowledged').map((d) => d.id),
    [data]
  );
  const allSelected =
    unackIds.length > 0 && unackIds.every((id) => selectedIds.has(id));

  const handleBulkAcknowledge = React.useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsBulkSubmitting(true);
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Sesi tidak valid.');
      setIsBulkSubmitting(false);
      return;
    }
    let success = 0;
    let failed = 0;
    for (const logId of selectedIds) {
      try {
        await updateIntrusiLogStatus(
          logId,
          { status: 'acknowledged' } as UpdateIncidentStatusPayload,
          session.access_token
        );
        onLogUpdate(logId, { status: 'acknowledged' as any });
        success++;
      } catch {
        failed++;
      }
    }
    setSelectedIds(new Set());
    setIsBulkSubmitting(false);
    if (success > 0) toast.success(`${success} insiden berhasil dikonfirmasi.`);
    if (failed > 0) toast.error(`${failed} insiden gagal dikonfirmasi.`);
  }, [selectedIds, onLogUpdate]);

  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>(
    searchParams.get('status') ? searchParams.get('status')!.split(',') : []
  );
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>(
    searchParams.get('event_type')
      ? searchParams.get('event_type')!.split(',')
      : []
  );
  const [selectedSystemStates, setSelectedSystemStates] = React.useState<
    string[]
  >(
    searchParams.get('system_state')
      ? searchParams.get('system_state')!.split(',')
      : []
  );
  const [selectedDoorStates, setSelectedDoorStates] = React.useState<string[]>(
    searchParams.get('door_state')
      ? searchParams.get('door_state')!.split(',')
      : []
  );

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedStatuses(
      searchParams.get('status') ? searchParams.get('status')!.split(',') : []
    );
    setSelectedEvents(
      searchParams.get('event_type')
        ? searchParams.get('event_type')!.split(',')
        : []
    );
    setSelectedSystemStates(
      searchParams.get('system_state')
        ? searchParams.get('system_state')!.split(',')
        : []
    );
    setSelectedDoorStates(
      searchParams.get('door_state')
        ? searchParams.get('door_state')!.split(',')
        : []
    );
  }, [searchParams]);

  const toggleSelection = (
    val: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(
      list.includes(val) ? list.filter((item) => item !== val) : [...list, val]
    );
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (selectedStatuses.length > 0)
      params.set('status', selectedStatuses.join(','));
    else params.delete('status');

    if (selectedEvents.length > 0)
      params.set('event_type', selectedEvents.join(','));
    else params.delete('event_type');

    if (selectedSystemStates.length > 0)
      params.set('system_state', selectedSystemStates.join(','));
    else params.delete('system_state');

    if (selectedDoorStates.length > 0)
      params.set('door_state', selectedDoorStates.join(','));
    else params.delete('door_state');

    router.push(`${pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

  const currentPage = Number(searchParams.get('page') || '1');
  const perPage = Number(searchParams.get('per_page') || '25');
  const totalPages = Math.ceil((pagination?.total || 0) / perPage);

  const columns = React.useMemo(
    () =>
      getColumns(
        onLogUpdate,
        selectedIds,
        toggleSelect,
        toggleSelectAll,
        allSelected
      ),
    [onLogUpdate, selectedIds, toggleSelect, toggleSelectAll, allSelected]
  );

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )
        return;

      const rows = table.getRowModel().rows;

      if (e.key === 'j' || (e.key === 'ArrowDown' && !e.metaKey)) {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.min(prev + 1, rows.length - 1));
      } else if (e.key === 'k' || (e.key === 'ArrowUp' && !e.metaKey)) {
        e.preventDefault();
        setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && !e.metaKey) {
        e.preventDefault();
        if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
          rows[focusedRowIndex].toggleExpanded();
        }
      } else if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
          const row = rows[focusedRowIndex];
          if (row.original.status === 'unacknowledged') {
            toggleSelect(row.original.id);
          }
        }
      } else if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setFocusedRowIndex(-1);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, expanded },
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true,
    pageCount: totalPages
  });

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    params.set('per_page', perPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePerPageChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    params.set('per_page', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const exportToCsv = () => {
    const headers = [
      'Waktu',
      'Jenis Event',
      'Status',
      'State Sistem',
      'Pintu',
      'Peak ΔG',
      'Catatan'
    ];
    const evtLabels: Record<string, string> = {
      IMPACT_WARNING: 'Peringatan Benturan',
      FORCED_ENTRY_ALARM: 'Alarm Paksa Masuk',
      UNAUTHORIZED_OPEN: 'Buka Tanpa Izin',
      POWER_SOURCE_CHANGED: 'Ganti Daya',
      BATTERY_LEVEL_CHANGED: 'Level Baterai',
      SIREN_SILENCED: 'Sirine Dimatikan',
      ARM: 'Aktivasi Sistem',
      DISARM: 'Penonaktifan Sistem'
    };
    const statusLabels: Record<string, string> = {
      unacknowledged: 'Belum Ditinjau',
      acknowledged: 'Dikonfirmasi',
      resolved: 'Teratasi',
      false_alarm: 'Alarm Palsu'
    };
    const rows = data.map((log) => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      evtLabels[log.event_type] || log.event_type,
      statusLabels[log.status] || log.status,
      log.system_state === 'ARMED' ? 'Aktif' : 'Nonaktif',
      log.door_state === 'CLOSED' ? 'Tertutup' : 'Terbuka',
      log.peak_delta_g?.toFixed(2) ?? '',
      (log.notes || '').replace(/"/g, '""')
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intrusi-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4">
      {/* Filter + Export */}
      <div className="flex items-center gap-2">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="default" size="sm" className="h-8">
              <Filter className="mr-2 h-4 w-4" />
              Filter Data
              {selectedStatuses.length +
                selectedEvents.length +
                selectedSystemStates.length +
                selectedDoorStates.length >
                0 && (
                <Badge
                  variant="neutral"
                  className="ml-2 px-1 font-normal text-xs rounded-sm"
                >
                  {selectedStatuses.length +
                    selectedEvents.length +
                    selectedSystemStates.length +
                    selectedDoorStates.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0 bg-secondary/80 backdrop-blur-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            align="start"
          >
            <ScrollArea className="h-[400px]">
              <div className="grid gap-4 p-4">
                <div className="space-y-2 pb-2 border-b border-black/10">
                  <h4 className="font-bold leading-none">Filter Data</h4>
                  <p className="text-sm text-foreground/80">
                    Pilih kriteria untuk menyaring log intrusi.
                  </p>
                </div>
                <div className="grid gap-4 mt-2">
                  {/* Status Filter */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Status</span>
                    {[
                      { label: 'Belum Ditinjau', value: 'unacknowledged' },
                      { label: 'Dikonfirmasi', value: 'acknowledged' },
                      { label: 'Teratasi', value: 'resolved' },
                      { label: 'Alarm Palsu', value: 'false_alarm' }
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className="flex flex-row items-center gap-2"
                      >
                        <Checkbox
                          id={`status-${opt.value}`}
                          checked={selectedStatuses.includes(opt.value)}
                          onCheckedChange={() =>
                            toggleSelection(
                              opt.value,
                              selectedStatuses,
                              setSelectedStatuses
                            )
                          }
                        />
                        <label
                          htmlFor={`status-${opt.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {/* Jenis Event Filter */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Jenis Event</span>
                    {[
                      { label: 'Peringatan Benturan', value: 'IMPACT_WARNING' },
                      {
                        label: 'Alarm Paksa Masuk',
                        value: 'FORCED_ENTRY_ALARM'
                      },
                      { label: 'Buka Tanpa Izin', value: 'UNAUTHORIZED_OPEN' },
                      {
                        label: 'Level Baterai',
                        value: 'BATTERY_LEVEL_CHANGED'
                      },
                      { label: 'Aktivasi Sistem', value: 'ARM' },
                      { label: 'Penonaktifan Sistem', value: 'DISARM' }
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className="flex flex-row items-center gap-2"
                      >
                        <Checkbox
                          id={`event-${opt.value}`}
                          checked={selectedEvents.includes(opt.value)}
                          onCheckedChange={() =>
                            toggleSelection(
                              opt.value,
                              selectedEvents,
                              setSelectedEvents
                            )
                          }
                        />
                        <label
                          htmlFor={`event-${opt.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {/* State Sistem Filter */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">State Sistem</span>
                    {[
                      { label: 'Aktif', value: 'ARMED' },
                      { label: 'Nonaktif', value: 'DISARMED' }
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className="flex flex-row items-center gap-2"
                      >
                        <Checkbox
                          id={`system-${opt.value}`}
                          checked={selectedSystemStates.includes(opt.value)}
                          onCheckedChange={() =>
                            toggleSelection(
                              opt.value,
                              selectedSystemStates,
                              setSelectedSystemStates
                            )
                          }
                        />
                        <label
                          htmlFor={`system-${opt.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {/* Pintu Column */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">State Pintu</span>
                    {[
                      { label: 'Tertutup', value: 'CLOSED' },
                      { label: 'Terbuka', value: 'OPEN' }
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        className="flex flex-row items-center gap-2"
                      >
                        <Checkbox
                          id={`door-${opt.value}`}
                          checked={selectedDoorStates.includes(opt.value)}
                          onCheckedChange={() =>
                            toggleSelection(
                              opt.value,
                              selectedDoorStates,
                              setSelectedDoorStates
                            )
                          }
                        />
                        <label
                          htmlFor={`door-${opt.value}`}
                          className="text-sm cursor-pointer border-b-transparent"
                        >
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {/* Buttons */}
                  <div className="flex gap-2 pt-3 mt-1 border-t border-black/10">
                    <Button
                      variant="neutral"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedStatuses([]);
                        setSelectedEvents([]);
                        setSelectedSystemStates([]);
                        setSelectedDoorStates([]);

                        const params = new URLSearchParams(
                          searchParams.toString()
                        );
                        params.set('page', '1');
                        params.delete('status');
                        params.delete('event_type');
                        params.delete('system_state');
                        params.delete('door_state');
                        router.push(`${pathname}?${params.toString()}`);
                        setIsFilterOpen(false);
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={applyFilters}
                    >
                      Terapkan
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button
          variant="neutral"
          size="sm"
          className="h-8"
          onClick={exportToCsv}
          disabled={data.length === 0}
        >
          <Download className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">CSV</span>
        </Button>

        {selectedIds.size > 0 && (
          <Button
            variant="default"
            size="sm"
            className="h-8"
            onClick={handleBulkAcknowledge}
            disabled={isBulkSubmitting}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            {isBulkSubmitting
              ? 'Memproses...'
              : `Konfirmasi (${selectedIds.size})`}
          </Button>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors hidden lg:flex items-center">
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent align="end" className="space-y-1 text-xs">
              <p className="font-semibold mb-1">Pintasan Keyboard</p>
              <p>
                <kbd className="font-mono bg-muted px-1 rounded">j</kbd> /{' '}
                <kbd className="font-mono bg-muted px-1 rounded">k</kbd> —
                navigasi baris
              </p>
              <p>
                <kbd className="font-mono bg-muted px-1 rounded">Enter</kbd> —
                buka / tutup detail
              </p>
              <p>
                <kbd className="font-mono bg-muted px-1 rounded">a</kbd> — pilih
                baris terfokus
              </p>
              <p>
                <kbd className="font-mono bg-muted px-1 rounded">Esc</kbd> —
                batal pilihan
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Table */}
      <div ref={tableContainerRef}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={[
                      'px-2 sm:px-4 h-10 sm:h-12',
                      (header.column.columnDef.meta as any)?.className ?? ''
                    ].join(' ')}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={[
                      'transition-colors hover:bg-muted/20 hover:text-foreground',
                      getSeverityColor(row.original.event_type),
                      highlightIds?.has(row.original.id)
                        ? 'animate-row-highlight'
                        : '',
                      focusedRowIndex === rowIndex
                        ? 'outline outline-2 outline-primary/40 outline-offset-[-1px]'
                        : '',
                      selectedIds.has(row.original.id)
                        ? 'bg-primary/10 dark:bg-primary/15'
                        : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={[
                          'px-2 sm:px-4 py-2 sm:py-4',
                          (cell.column.columnDef.meta as any)?.className ?? ''
                        ].join(' ')}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <ExpandableReviewForm
                          log={row.original}
                          onLogUpdate={onLogUpdate}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Belum ada data log intrusi.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination matching Keamanan style */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
          <div className="text-sm text-muted-foreground">
            Total {pagination?.total || 0} event.
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center space-x-4">
              {/* Rows per page */}
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium whitespace-nowrap">Baris</p>
                <Select
                  value={perPage.toString()}
                  onValueChange={handlePerPageChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* navigation buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  className="hidden sm:flex h-8 w-8 p-0"
                  onClick={() => goToPage(1)}
                  disabled={currentPage <= 1}
                  variant="neutral"
                  size="icon"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  variant="neutral"
                  size="icon"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  {currentPage} / {totalPages || 1}
                </div>
                <Button
                  className="h-8 w-8 p-0"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  variant="neutral"
                  size="icon"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  className="hidden sm:flex h-8 w-8 p-0"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  variant="neutral"
                  size="icon"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
