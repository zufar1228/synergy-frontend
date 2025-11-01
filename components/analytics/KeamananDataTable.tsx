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
  // --- 1. Impor ExpandedState ---
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  X,
  Camera,
  ListTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  KeamananLog,
  UpdateIncidentStatusPayload,
  updateKeamananLogStatus,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Import komponen untuk dialog review
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Form Review (sebelumnya Dialog, sekarang untuk baris 'expand') ---
const formSchema = z.object({
  status: z.enum(["acknowledged", "resolved", "false_alarm"]),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

// --- 2. GANTI NAMA dan HAPUS LOGIKA DIALOG ---
// Komponen ini sekarang hanya me-render form, bukan dialog
const ExpandableReviewForm = ({
  log,
  onSuccess,
  onLogUpdate,
}: {
  log: KeamananLog;
  onSuccess: () => void;
  onLogUpdate?: (logId: string, updates: Partial<KeamananLog>) => void;
}) => {
  // Hapus state [open, setOpen]

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: log.status as "acknowledged" | "resolved" | "false_alarm",
      notes: log.notes || "",
    },
  });

  // Reset form jika log berubah (misalnya data di-refresh)
  React.useEffect(() => {
    form.reset({
      status: log.status as "acknowledged" | "resolved" | "false_alarm",
      notes: log.notes || "",
    });
  }, [log.status, log.notes, form]);

  async function onSubmit(values: FormData) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return toast.error("Sesi tidak valid.");
    try {
      console.log("Updating log status:", log.id, values);
      await updateKeamananLogStatus(
        log.id,
        values as UpdateIncidentStatusPayload,
        session.access_token
      );
      console.log("Log status updated successfully");

      if (onLogUpdate) {
        onLogUpdate(log.id, {
          status: values.status,
          notes: values.notes,
        });
      }

      toast.success("Status log berhasil diperbarui.");
      // Hapus setOpen(false)
      onSuccess(); // Panggil onSuccess untuk menutup baris expand
    } catch (error) {
      console.error("Error updating log status:", error);
      toast.error((error as Error).message);
    }
  }

  // Render form secara langsung, tanpa Dialog/DialogTrigger
  return (
    // Tambahkan padding dan background untuk membedakannya, dengan max-width constraint
    <div className="p-4 sm:p-6 bg-gray-900/50 rounded-md max-w-full overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300">
      {/* Ganti DialogHeader dengan div biasa */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">
          Review Deteksi Keamanan
        </h3>
        <p className="text-sm text-gray-300">
          Lihat gambar dan perbarui status deteksi ini.
        </p>
      </div>
      <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
        <div className="py-2">
          <a href={log.image_url} target="_blank" rel="noopener noreferrer">
            <img
              src={log.image_url}
              alt="Deteksi Keamanan"
              className="rounded-md border max-h-64 w-full object-contain"
            />
          </a>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="false_alarm">False Alarm</SelectItem>
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
                  <FormLabel className="text-white">Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tambahkan catatan..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Ganti DialogFooter dengan div biasa */}
            <div className="flex justify-end">
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

// --- 2. BUAT KOMPONEN BARU UNTUK MENAMPILKAN ATRIBUT ---
const AttributeDetails = ({ data }: { data: any[] | null }) => {
  // Data adalah array dari orang yang terdeteksi, contoh:
  // [ { "box": {...}, "confidence": 0.9, "attributes": [...] } ]

  if (!data || data.length === 0) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="px-2 py-0 h-auto text-black flex items-center gap-2">
          <ListTree className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Atribut Terdeteksi</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {data.map((person, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <h4 className="font-semibold mb-2">
                Orang {index + 1} (Keyakinan:{" "}
                {(person.confidence * 100).toFixed(0)}%)
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {person.attributes.map((attr: any, i: number) => (
                  <li key={i}>
                    {/* Membersihkan teks dari skrip Python */}
                    <span className="capitalize">
                      {attr.attribute
                        .replace("person wearing a ", "")
                        .replace("person not wearing a ", "")}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      ({(attr.confidence * 100).toFixed(0)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Komponen Tabel Utama ---
export function KeamananDataTable({
  data,
  pagination,
  onLogUpdate,
}: {
  data: KeamananLog[];
  pagination: any;
  onLogUpdate?: (logId: string, updates: Partial<KeamananLog>) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  // --- 3. Tambah state untuk 'expanded' ---
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  // Definisikan kolom di sini
  const columns: ColumnDef<KeamananLog>[] = [
    {
      accessorKey: "status",
      header: "Status",
      size: 100, // Fixed width for status column
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
    {
      accessorKey: "image_url",
      header: "Gambar",
      size: 120, // Fixed width for image column
      cell: ({ row }) => {
        const imageUrl = row.getValue("image_url") as string;
        const deviceName = row.original.device?.name || "Unknown Device";

        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="px-2 py-0 h-auto text-black flex items-center gap-2">
                <Camera className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Pratinjau Gambar: {deviceName}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {/* Menambahkan link agar tetap bisa dibuka di tab baru jika ingin */}
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka di tab baru"
                >
                  <img
                    src={imageUrl}
                    alt={`Deteksi ${deviceName}`}
                    className="rounded-md border w-full h-auto max-h-[70vh] object-contain"
                  />
                </a>
              </div>
            </DialogContent>
          </Dialog>
        );
      },
    },
    {
      accessorKey: "detected",
      header: "Terdeteksi?",
      size: 100, // Fixed width for detected column
      cell: ({ row }) => {
        const isDetected = row.getValue("detected");

        // Handle different data types that might come from backend
        if (
          isDetected === true ||
          isDetected === "true" ||
          isDetected === 1 ||
          isDetected === "1"
        ) {
          return (
            <div className="w-6 h-6 bg-green-500 text-white flex items-center justify-center font-bold text-sm rounded">
              ✓
            </div>
          );
        }

        if (
          isDetected === false ||
          isDetected === "false" ||
          isDetected === 0 ||
          isDetected === "0"
        ) {
          return (
            <div className="w-6 h-6 bg-red-500 text-white flex items-center justify-center font-bold text-sm rounded">
              ✗
            </div>
          );
        }

        // If null, undefined, or any other value, show dash
        return (
          <div className="w-6 h-6 bg-gray-500 text-white flex items-center justify-center font-bold text-sm rounded">
            -
          </div>
        );
      },
    },
    {
      accessorKey: "attributes",
      header: "Atribut",
      size: 150,
      cell: ({ row }) => <AttributeDetails data={row.getValue("attributes")} />,
    },
    {
      accessorKey: "created_at",
      header: "Waktu",
      size: 120,
      cell: ({ row }) =>
        format(new Date(row.getValue("created_at")), "dd MMM, HH:mm:ss"),
    },
    {
      id: "actions",
      size: 100,
      // --- 4. Ubah 'cell' untuk tombol 'actions' ---
      cell: ({ row }) => (
        <Button size="sm" onClick={() => row.toggleExpanded()}>
          {row.getIsExpanded() ? "Tutup" : "Review"}
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    // --- 5. Tambahkan konfigurasi 'expanded' ---
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: {
      columnFilters,
      expanded, // Tambahkan state expanded di sini
    },
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleRowsPerPageChange = (perPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("per_page", perPage.toString());
    params.set("page", "1"); // Reset to first page
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full space-y-4">
      {/* Toolbar: Filter dan Column Toggle */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter status..."
          value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("status")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md overflow-x-auto">
        <Table className="min-w-full table-fixed w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              // --- 6. Modifikasi rendering TableBody ---
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  {/* Baris data asli */}
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Baris 'expanded' yang kondisional */}
                  {row.getIsExpanded() && (
                    <TableRow className="transition-all duration-300 ease-in-out">
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="max-w-full overflow-hidden"
                      >
                        {/* Render komponen form di sini */}
                        <ExpandableReviewForm
                          log={row.original}
                          onLogUpdate={onLogUpdate}
                          onSuccess={() => {
                            row.toggleExpanded(false); // Tutup baris setelah sukses
                          }}
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
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Paginasi */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {pagination?.total || 0} total entries
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium whitespace-nowrap">
              Rows per page
            </p>
            <Select
              value={`${pagination?.per_page || 25}`}
              onValueChange={(value) => handleRowsPerPageChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
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
          <div className="flex items-center justify-center text-sm font-medium min-w-0">
            Page {pagination?.current_page || 1} of{" "}
            {pagination?.total_pages || 1}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              className="h-8 w-8 p-0 hidden sm:flex"
              onClick={() => handlePageChange(1)}
              disabled={pagination?.current_page === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={() =>
                handlePageChange((pagination?.current_page || 1) - 1)
              }
              disabled={pagination?.current_page === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={() =>
                handlePageChange((pagination?.current_page || 1) + 1)
              }
              disabled={pagination?.current_page === pagination?.total_pages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0 hidden sm:flex"
              onClick={() => handlePageChange(pagination?.total_pages || 1)}
              disabled={pagination?.current_page === pagination?.total_pages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
