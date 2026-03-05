'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';
import type { LingkunganLog } from '@/lib/api';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  page?: number;
  per_page?: number;
}

interface LingkunganDataTableProps {
  data: LingkunganLog[];
  pagination?: Pagination;
  highlightIds: Set<string>;
}

export const LingkunganDataTable = ({
  data,
  pagination,
  highlightIds
}: LingkunganDataTableProps) => {

  // derive current page and total pages from API response (page & per_page)
  const currentPage = pagination?.page || 1;
  const perPageFromApi = pagination?.per_page || pagination?.limit || 25;
  const totalPages = pagination
    ? Math.ceil(pagination.total / perPageFromApi)
    : 1;

  // ensure state sync with API per_page when first rendered
  const [perPage, setPerPage] = useState(perPageFromApi);

  // --- pagination helpers copied from Intrusi/Keamanan tables ---
  const goToPage = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(page));
    params.set('per_page', String(perPage));
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
    params.set('per_page', value);
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Belum ada data lingkungan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((log) => {
                const isNew = highlightIds.has(log.id);

                return (
                  <TableRow
                    key={log.id}
                    className={cn(
                      'transition-colors duration-700',
                      isNew && 'bg-green-50 dark:bg-green-950/30'
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
