/**
 * @file IntrusiReviewForm.tsx
 * @purpose Expandable inline form for reviewing/updating intrusi log status (acknowledge, resolve, false_alarm)
 * @usedBy IntrusiDataTable (expanded row)
 * @deps react-hook-form, zod, supabase/client, lib/api (updateIntrusiLogStatus), Form UI
 * @exports ExpandableReviewForm
 * @sideEffects API call (PUT intrusi log status)
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  IntrusiLog,
  UpdateIncidentStatusPayload,
  updateIntrusiLogStatus
} from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const formSchema = z.object({
  status: z.enum(['acknowledged', 'resolved', 'false_alarm']),
  notes: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

export function ExpandableReviewForm({
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
