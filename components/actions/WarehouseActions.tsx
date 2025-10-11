"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client"; // <-- TAMBAHKAN INI: Import Supabase client
import {
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  Warehouse,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, { message: "Nama minimal 3 karakter." }),
  location: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof formSchema>;

// --- Komponen Form (untuk Create & Update) ---
const WarehouseForm = ({
  onSuccess,
  initialData,
}: {
  onSuccess: () => void;
  initialData?: Warehouse;
}) => {
  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      location: initialData?.location || "",
    },
  });

  const { isSubmitting } = form.formState;

  // --- FUNGSI ONSUBMIT YANG DIMODIFIKASI ---
  async function onSubmit(values: WarehouseFormData) {
    // 1. Inisialisasi Supabase client
    const supabase = createClient();
    // 2. Dapatkan sesi pengguna saat ini
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 3. Validasi sesi
    if (!session) {
      toast.error("Sesi tidak valid. Silakan login kembali.");
      return;
    }

    // Pastikan location tidak null, tapi bisa string kosong atau undefined
    const submissionData = {
      ...values,
      location: values.location || undefined,
    };

    try {
      if (initialData) {
        // 4. Kirim access_token saat update
        await updateWarehouse(
          initialData.id,
          submissionData,
          session.access_token
        );
        toast.success("Gudang berhasil diperbarui.");
      } else {
        // 5. Kirim access_token saat membuat baru
        await createWarehouse(submissionData, session.access_token);
        toast.success("Gudang baru berhasil dibuat.");
      }
      onSuccess();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Gudang</FormLabel>
              <FormControl>
                <Input placeholder="Gudang Pusat" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lokasi</FormLabel>
              <FormControl>
                <Input
                  placeholder="Jakarta Selatan"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// --- Komponen Tombol Tambah & Edit (Tidak ada perubahan di sini) ---
export const AddWarehouseButton = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Gudang
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Gudang Baru</DialogTitle>
        </DialogHeader>
        <WarehouseForm
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

const EditWarehouseButton = ({ warehouse }: { warehouse: Warehouse }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="neutral" size="sm" className="mr-2">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Gudang</DialogTitle>
        </DialogHeader>
        <WarehouseForm
          initialData={warehouse}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

// --- Tombol Aksi (Edit & Hapus) untuk setiap baris tabel ---
export const WarehouseActionButtons = ({
  warehouse,
}: {
  warehouse: Warehouse;
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // --- FUNGSI HANDLEDELETE YANG DIMODIFIKASI ---
  const handleDelete = async () => {
    setIsDeleting(true);

    // 1. Inisialisasi Supabase client
    const supabase = createClient();
    // 2. Dapatkan sesi pengguna saat ini
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 3. Validasi sesi
    if (!session) {
      toast.error("Sesi tidak valid. Silakan login kembali.");
      setIsDeleting(false); // Hentikan status loading
      return;
    }

    try {
      // 4. Kirim access_token saat menghapus
      await deleteWarehouse(warehouse.id, session.access_token);
      toast.success(`Gudang "${warehouse.name}" berhasil dihapus.`);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <EditWarehouseButton warehouse={warehouse} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive">
            Hapus
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Anda yakin ingin menghapus "{warehouse.name}"?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Aksi ini tidak bisa dibatalkan. Ini akan menghapus gudang beserta
            semua area dan perangkat di dalamnya.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
