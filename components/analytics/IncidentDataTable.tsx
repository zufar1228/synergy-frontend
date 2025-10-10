// frontend/components/analytics/IncidentDataTable.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
// --- 1. IMPORT IKON BARU ---
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// ... (Interface dan ColumnDef tidak berubah)
interface Incident {
  id: string;
  created_at: string;
  incident_type: string;
  confidence: number | null;
  device: { name: string };
}
interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
export const columns: ColumnDef<Incident>[] = [
  { accessorKey: "incident_type", header: "Tipe Insiden" },
  {
    accessorKey: "device.name",
    header: "Perangkat",
    cell: ({ row }) => <span>{row.original.device?.name || "N/A"}</span>,
  },
  {
    accessorKey: "confidence",
    header: "Keyakinan",
    cell: ({ row }) =>
      row.original.confidence
        ? `${(row.original.confidence * 100).toFixed(1)}%`
        : "N/A",
  },
  {
    accessorKey: "created_at",
    header: "Waktu",
    cell: ({ row }) =>
      format(new Date(row.original.created_at), "dd MMM yyyy, HH:mm:ss", {
        locale: enUS,
      }),
  },
];

export function IncidentDataTable({
  data,
  pagination,
}: {
  data: Incident[];
  pagination: PaginationInfo;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.per_page,
      },
    },
    manualPagination: true,
    pageCount: pagination.total_pages,
  });

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.total_pages) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleRowsPerPageChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("per_page", value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full space-y-4">
      {/* Toolbar: Filter dan Column Toggle */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter berdasarkan tipe insiden..."
          value={
            (table.getColumn("incident_type")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("incident_type")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="ml-auto">Kolom</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id.replace("_", " ")}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Tidak ada hasil.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* === 2. GANTI SELURUH BAGIAN PAGINASI LAMA DENGAN INI === */}
      <div className="flex items-center justify-between flex-wrap gap-x-6 gap-y-4 px-2">
        <div className="text-sm text-muted-foreground">
          Total {pagination.total} insiden.
        </div>
        <div className="flex items-center flex-wrap justify-end gap-x-6 gap-y-2">
          <div className="flex items-center space-x-4">
            {/* Kontrol Baris per Halaman */}
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows</p>
              <Select
                value={`${pagination.per_page}`}
                onValueChange={handleRowsPerPageChange}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pagination.per_page} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 25, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Halaman & Tombol Navigasi */}
            <div className="flex items-center space-x-2">
              <Button
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {pagination.page} of {pagination.total_pages}
              </div>

              <Button
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => handlePageChange(pagination.total_pages)}
                disabled={pagination.page >= pagination.total_pages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* ========================================================== */}
    </div>
  );
}
