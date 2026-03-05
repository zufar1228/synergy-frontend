'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ListChecks,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';
import {
  updateLingkunganLogStatus,
  type UpdateIncidentStatusPayload
} from '@/lib/api';
import type { LingkunganLog } from '@/lib/api';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface LingkunganDataTableProps {
  data: LingkunganLog[];
  pagination?: Pagination;
  onLogUpdate: (logId: string, updates: Partial<LingkunganLog>) => void;
  highlightIds: Set<string>;
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'neutral' | null }
> = {
  unacknowledged: { label: 'Belum Ditinjau', variant: 'default' },
  acknowledged: { label: 'Ditinjau', variant: 'neutral' },
  resolved: { label: 'Selesai', variant: 'neutral' },
  false_alarm: { label: 'Alarm Palsu', variant: 'neutral' }
};

export const LingkunganDataTable = ({
  data,
  pagination,
  onLogUpdate,
  highlightIds
}: LingkunganDataTableProps) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const supabase = createClient();

  const handleStatusChange = async (logId: string, newStatus: string) => {
    setUpdatingId(logId);
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error('Sesi tidak valid.');
      setUpdatingId(null);
      return;
    }

    try {
      const payload: UpdateIncidentStatusPayload = {
        status: newStatus as UpdateIncidentStatusPayload['status']
      };
      await updateLingkunganLogStatus(logId, payload, session.access_token);
      onLogUpdate(logId, { status: newStatus as LingkunganLog['status'] });
      toast.success('Status berhasil diperbarui.');
    } catch (error) {
      toast.error('Gagal memperbarui status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const currentPage = pagination
    ? Math.floor(pagination.offset / pagination.limit) + 1
    : 1;
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 1;

  // --- pagination helpers copied from Intrusi/Keamanan tables ---
  const [perPage, setPerPage] = useState(pagination?.limit || 25);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(page));
    params.set('limit', String(perPage));
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}?${params.toString()}`
    );
    window.location.reload();
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
    const params = new URLSearchParams(window.location.search);
    params.set('page', '1');
    params.set('limit', value);
    window.history.pushState(
      null,
      '',
      `${window.location.pathname}?${params.toString()}`
    );
    window.location.reload();
  };

  return (
    <>
      {/* header outside card */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-medium">Riwayat Data Lingkungan</h3>
        {pagination && (
          <span className="text-xs font-normal text-muted-foreground">
            {pagination.total} total data
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Waktu</TableHead>
              <TableHead className="text-center">
                <span className="inline-flex items-center gap-1">
                  <Thermometer className="h-3 w-3 text-red-500" />
                  Suhu (°C)
                </span>
              </TableHead>
              <TableHead className="text-center">
                <span className="inline-flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-blue-500" />
                  Kelembapan (%)
                </span>
              </TableHead>
              <TableHead className="text-center">
                <span className="inline-flex items-center gap-1">
                  <Wind className="h-3 w-3 text-purple-500" />
                  CO₂ (ppm)
                </span>
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center w-[140px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Belum ada data lingkungan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((log) => {
                const config =
                  statusConfig[log.status] || statusConfig.unacknowledged;
                const isNew = highlightIds.has(log.id);

                return (
                  <TableRow
                    key={log.id}
                    className={cn(
                      'transition-colors duration-700',
                      isNew && 'bg-green-50 dark:bg-green-950/30',
                      log.status === 'unacknowledged' &&
                        'bg-red-50/50 dark:bg-red-950/20'
                    )}
                  >
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span
                        className={cn(
                          log.temperature > 35
                            ? 'text-red-600 font-bold'
                            : log.temperature > 32
                              ? 'text-orange-500'
                              : ''
                        )}
                      >
                        {log.temperature.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span
                        className={cn(
                          log.humidity > 80
                            ? 'text-blue-600 font-bold'
                            : log.humidity > 75
                              ? 'text-cyan-500'
                              : ''
                        )}
                      >
                        {log.humidity.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span
                        className={cn(
                          log.co2 > 1500
                            ? 'text-red-600 font-bold'
                            : log.co2 > 1000
                              ? 'text-orange-500'
                              : ''
                        )}
                      >
                        {log.co2.toFixed(0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={config.variant ?? 'default'}
                        className={cn(
                          'text-[10px] sm:text-xs',
                          log.status === 'unacknowledged' &&
                            'bg-red-500 text-white',
                          log.status === 'resolved' &&
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                          log.status === 'false_alarm' &&
                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        )}
                      >
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {log.status === 'unacknowledged' ? (
                        <Select
                          onValueChange={(val) =>
                            handleStatusChange(log.id, val)
                          }
                          disabled={updatingId === log.id}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs mx-auto">
                            <SelectValue placeholder="Ubah..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acknowledged">
                              Ditinjau
                            </SelectItem>
                            <SelectItem value="resolved">Selesai</SelectItem>
                            <SelectItem value="false_alarm">
                              Alarm Palsu
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination matching Keamanan style */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
          <div className="text-sm text-foreground">
            <span className="text-sm text-foreground">
              Total {pagination?.total || 0} data.
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center space-x-4">
              {/* Rows per page */}
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium whitespace-nowrap">Rows</p>
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
                  Page {currentPage}/{totalPages || 1}
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
    </>
  );
};
