// frontend/components/profile/UpdatePreferencesForm.tsx
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { NotificationPreference, updateMyPreferences } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// Definisikan sistem yang bisa di-subscribe pengguna
const availableSystems = [
  { id: "lingkungan", label: "Lingkungan (Suhu, Kelembapan)" },
  { id: "gangguan", label: "Gangguan (Insiden, Benturan)" },
  { id: "keamanan", label: "Keamanan (Gerakan)" },
  { id: "medis_air", label: "Air Medis (pH, Kekeruhan)" },
];

// Skema validasi untuk form
const formSchema = z.object({
  preferences: z.array(
    z.object({
      system_type: z.string(),
      is_enabled: z.boolean(),
    })
  ),
});

type FormData = z.infer<typeof formSchema>;

export const UpdatePreferencesForm = ({
  initialData,
}: {
  initialData: NotificationPreference[];
}) => {
  // Inisialisasi form dengan data dari API + data default
  const defaultValues = availableSystems.map((system) => {
    const existingPref = initialData.find((p) => p.system_type === system.id);
    return {
      system_type: system.id,
      is_enabled: existingPref ? existingPref.is_enabled : true, // Default ke 'true' jika belum ada
    };
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { preferences: defaultValues },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "preferences",
  });

  async function onSubmit(values: FormData) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return toast.error("Sesi tidak valid.");

    try {
      await updateMyPreferences(values.preferences, session.access_token);
      toast.success("Preferensi notifikasi berhasil diperbarui.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferensi Notifikasi</CardTitle>
        <CardDescription>
          Pilih notifikasi email yang ingin Anda terima.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`preferences.${index}.is_enabled`}
                  render={({ field: switchField }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-sm">
                        {availableSystems[index].label}
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={switchField.value}
                          onCheckedChange={switchField.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Menyimpan..."
                : "Simpan Preferensi"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
