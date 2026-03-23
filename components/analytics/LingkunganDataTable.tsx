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
  Wind,
  TrendingUp
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
  latestPrediction?: {
    timestamp: string;
    predicted_temperature: number;
    predicted_humidity: number;
    predicted_co2: number;
  } | null;
  pagination?: Pagination;
  highlightIds: Set<string>;
}

export const LingkunganDataTable = ({
  data,
  latestPrediction,
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

  // Combine prediction and historical data
  const combinedData = React.useMemo(() => {
    const list: any[] = [];
    if (latestPrediction) {
      list.push({
        id: `pred-${latestPrediction.timestamp}`,
        timestamp: latestPrediction.timestamp,
        temperature: latestPrediction.predicted_temperature,
        humidity: latestPrediction.predicted_humidity,
        co2: latestPrediction.predicted_co2,
        isPrediction: true
      });
    }
    // Assume data is already sorted newest first by the parent
    list.push(...data);
    
    // Sort just in case to ensure prediction (future timestamp) is at the top
    return list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [data, latestPrediction]);

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
      </div>
      <div className="overflow-visible pb-2 mb-2 pr-2">
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
                  <Droplets className="h-3 w-3" />
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
            {combinedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Belum ada data lingkungan.
                </TableCell>
              </TableRow>
            ) : (
              combinedData.map((log) => {
                const isNew = highlightIds.has(log.id);
                const isPrediction = log.isPrediction;

                return (
                  <TableRow 
                    key={log.id} 
                    className={cn(
                      isPrediction && "bg-muted/30 border-l-4 border-l-green-500"
                    )}
                  >
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className={cn(isPrediction && "text-muted-foreground italic")}>
                          {new Date(log.timestamp).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                        {isPrediction && (
                          <span className="text-[10px] text-green-600 dark:text-green-500 font-medium flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Prediksi (15m)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span
                        className={cn(
                          isPrediction && "italic text-muted-foreground",
                          log.temperature > 35
                            ? 'text-red-600 font-bold'
                            : log.temperature > 32
                              ? 'text-orange-500'
                              : ''
                        )}
                      >
                        {Number(log.temperature).toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span className={cn(isPrediction && "italic text-muted-foreground")}>
                        {Number(log.humidity).toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span
                        className={cn(
                          isPrediction && "italic text-muted-foreground",
                          log.co2 > 1500
                            ? 'text-red-600 font-bold'
                            : log.co2 > 1000
                              ? 'text-orange-500'
                              : ''
                        )}
                      >
                        {Number(log.co2).toFixed(0)}
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
    </>
  );
};
