'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
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
  ChevronsRight
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
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  KeamananLog,
  UpdateIncidentStatusPayload,
  updateKeamananLogStatus
} from '@/lib/api';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/use-user-role';

// --- Form Schema ---
const formSchema = z.object({
  status: z.enum(['acknowledged', 'resolved', 'false_alarm']),
  notes: z.string().optional()
});
type FormData = z.infer<typeof formSchema>;

// --- Helper: filter attributes > 50% confidence ---
function getHighConfAttrs(
  log: KeamananLog
): { attribute: string; confidence: number }[] {
  if (!log.attributes || !Array.isArray(log.attributes)) return [];
  const result: { attribute: string; confidence: number }[] = [];
  for (const person of log.attributes as any[]) {
    const attrs = person.attributes || [person];
    if (!Array.isArray(attrs)) continue;
    for (const a of attrs) {
      const conf = typeof a.confidence === 'number' ? a.confidence : 0;
      if (conf > 0.5 && a.attribute && !a.attribute.includes('not wearing')) {
        result.push({
          attribute: a.attribute
            .replace('person wearing a ', '')
            .replace(' shirt', '')
            .replace(' hat', 'topi')
            .replace(' glasses', 'kacamata'),
          confidence: conf
        });
      }
    }
  }
  return result;
}

// --- Expandable Review Form ---
const ExpandableReviewForm = ({
  log,
  onSuccess,
  onLogUpdate
}: {
  log: KeamananLog;
  onSuccess: () => void;
  onLogUpdate?: (logId: string, updates: Partial<KeamananLog>) => void;
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: log.status as 'acknowledged' | 'resolved' | 'false_alarm',
      notes: log.notes || ''
    }
  });

  React.useEffect(() => {
    form.reset({
      status: log.status as 'acknowledged' | 'resolved' | 'false_alarm',
      notes: log.notes || ''
    });
  }, [log.status, log.notes, form]);

  async function onSubmit(values: FormData) {
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) return toast.error('Sesi tidak valid.');
    try {
      await updateKeamananLogStatus(
        log.id,
        values as UpdateIncidentStatusPayload,
        session.access_token
      );
      if (onLogUpdate) {
        onLogUpdate(log.id, { status: values.status, notes: values.notes });
      }
      toast.success('Status log berhasil diperbarui.');
      onSuccess();
    } catch (error) {
      console.error('Error updating log status:', error);
      toast.error((error as Error).message);
    }
  }

  const highConfAttrs = getHighConfAttrs(log);

  return (
    <div className="p-4 sm:p-6 bg-secondary border-y-2 border-border max-w-full overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300 font-base text-foreground">
      <div className="space-y-2">
        <h3 className="text-lg font-heading font-bold text-foreground">
          Review Deteksi Keamanan
        </h3>
        <p className="text-sm text-muted-foreground">
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
          {highConfAttrs.length > 0 && (
            <div className="mt-4 p-3 bg-secondary-background border-2 border-border rounded-base shadow-[2px_2px_0px_0px_var(--border)]">
              <h4 className="text-sm font-heading font-bold text-foreground mb-2">
                Atribut Terdeteksi
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground font-medium">
                {highConfAttrs.map((attr, i) => (
                  <li key={i}>
                    <span className="capitalize">{attr.attribute}</span>
                    <span className="text-muted-foreground ml-1">
                      ({Math.round(attr.confidence * 100)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-bold">
                    Status
                  </FormLabel>
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
                  <FormLabel className="text-foreground font-bold">
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tambahkan catatan..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

// --- Komponen Tabel Utama ---
export function KeamananDataTable({
  data,
  pagination,
  onLogUpdate,
  highlightIds
}: {
  data: KeamananLog[];
  pagination: any;
  onLogUpdate?: (logId: string, updates: Partial<KeamananLog>) => void;
  highlightIds?: Set<string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const { isAdmin } = useUserRole();

  const columnVisibility: VisibilityState = React.useMemo(
    () => (isAdmin ? ({} as VisibilityState) : { actions: false }),
    [isAdmin]
  );

  // Backend returns `page` not `current_page`
  const currentPage = pagination?.page || pagination?.current_page || 1;
  const totalPages = pagination?.total_pages || 1;

  const columns: ColumnDef<KeamananLog>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const getBadgeClass = (s: string) => {
          switch (s) {
            case 'resolved':
              return 'bg-green-600 text-white border-2 border-border shadow-[2px_2px_0px_0px_var(--border)]';
            case 'acknowledged':
              return 'bg-blue-600 text-white border-2 border-border shadow-[2px_2px_0px_0px_var(--border)]';
            case 'false_alarm':
              return 'bg-gray-600 text-white border-2 border-border shadow-[2px_2px_0px_0px_var(--border)]';
            default:
              return 'bg-red-600 text-white border-2 border-border shadow-[2px_2px_0px_0px_var(--border)]';
          }
        };
        return (
          <Badge className={getBadgeClass(status)}>
            {status.replace('_', ' ')}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Waktu',
      cell: ({ row }) =>
        format(new Date(row.getValue('created_at')), 'dd MMM, HH:mm:ss')
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" onClick={() => row.toggleExpanded()}>
          {row.getIsExpanded() ? 'Tutup' : 'Review'}
        </Button>
      ),
      enableHiding: true
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: { columnFilters, expanded, columnVisibility }
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleRowsPerPageChange = (perPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('per_page', perPage.toString());
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter status..."
          value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('status')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-base overflow-visible -mx-2 px-2 pb-2 mb-2 pr-2">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'whitespace-nowrap',
                      (header.column.columnDef.meta as any)?.className
                    )}
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
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={
                      highlightIds?.has(row.original.id)
                        ? 'animate-row-highlight'
                        : ''
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'whitespace-nowrap',
                          (cell.column.columnDef.meta as any)?.className
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow className="transition-all duration-300 ease-in-out">
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="max-w-full overflow-hidden"
                      >
                        <ExpandableReviewForm
                          log={row.original}
                          onLogUpdate={onLogUpdate}
                          onSuccess={() => row.toggleExpanded(false)}
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

      {/* Pagination */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
          <div className="text-sm text-muted-foreground">
            Total {pagination?.total || 0} deteksi.
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium whitespace-nowrap">Baris</p>
                <Select
                  value={`${pagination?.per_page || 25}`}
                  onValueChange={(value) =>
                    handleRowsPerPageChange(Number(value))
                  }
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pagination?.per_page || 25} />
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

              <div className="flex items-center space-x-2">
                <Button
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  className="h-8 w-8 p-0"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  {currentPage} / {totalPages}
                </div>

                <Button
                  className="h-8 w-8 p-0"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages}
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
