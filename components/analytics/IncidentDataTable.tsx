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
import { Badge } from "@/components/ui/badge"; // <-- Import Badge
import { ReviewIncidentAction } from "./IncidentActions"; // <-- Import komponen aksi baru

// Komponen terpisah untuk kolom aksi
const ActionsCell = ({ incident }: { incident: Incident }) => {
  const router = useRouter();
  return (
    <ReviewIncidentAction
      incident={incident}
      onSuccess={() => router.refresh()}
    />
  );
};

// ... (Interface dan ColumnDef tidak berubah)
interface Incident {
  id: string;
  area_id: string;
  device_id: string;
  incident_type: string;
  system_type: string;
  status: "unacknowledged" | "acknowledged" | "resolved" | "false_alarm";
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  device: { name: string };
}
interface PaginationInfo {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
// Perbarui definisi kolom
export const columns: ColumnDef<Incident>[] = [
  // Kolom "Status" BARU
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const getBadgeClass = (status: string) => {
        switch (status) {
          case "resolved":
            return "bg-green-600 text-white";
          case "acknowledged":
            return "bg-blue-600 text-white";
          case "false_alarm":
            return "bg-gray-600 text-white";
          default:
            return "bg-red-600 text-white";
        }
      };
      return (
        <Badge className={getBadgeClass(status)}>
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },
  { accessorKey: "incident_type", header: "Tipe Insiden" },
  {
    accessorKey: "device.name",
    header: "Perangkat",
    cell: ({ row }) => <span>{row.original.device?.name || "N/A"}</span>,
  },
  {
    accessorKey: "created_at",
    header: "Waktu",
    cell: ({ row }) =>
      row.original.created_at
        ? format(new Date(row.original.created_at), "dd MMM yyyy, HH:mm:ss")
        : "N/A",
  },
  // Kolom "Aksi" BARU
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell incident={row.original} />,
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

      <div className="rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
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
                    <TableCell key={cell.id} className="whitespace-nowrap">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
        <div className="text-sm text-muted-foreground">
          Total {pagination.total} insiden.
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-4">
            {/* Kontrol Baris per Halaman */}
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium whitespace-nowrap">Rows</p>
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
