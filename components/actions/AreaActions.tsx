"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client"; // <-- TAMBAHKAN INI
import {
  createArea,
  updateArea,
  deleteArea,
  getWarehouses,
  Area,
  Warehouse,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, { message: "Nama minimal 3 karakter." }),
  warehouse_id: z.string().min(1, { message: "Gudang harus dipilih." }),
});

type AreaFormData = z.infer<typeof formSchema>;

const AreaForm = ({
  onSuccess,
  initialData,
}: {
  onSuccess: () => void;
  initialData?: Area;
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const form = useForm<AreaFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      warehouse_id: initialData?.warehouse_id || undefined,
    },
  });

  // --- USEEFFECT YANG DIMODIFIKASI ---
  useEffect(() => {
    const fetchWarehouses = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesi tidak valid untuk memuat data gudang.");
        return;
      }
      try {
        const data = await getWarehouses(session.access_token);
        setWarehouses(data);
      } catch {
        toast.error("Gagal memuat data gudang.");
      }
    };
    fetchWarehouses();
  }, []);

  // --- FUNGSI ONSUBMIT YANG DIMODIFIKASI ---
  async function onSubmit(values: AreaFormData) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Sesi tidak valid. Silakan login kembali.");
      return;
    }

    try {
      if (initialData) {
        await updateArea(initialData.id, values, session.access_token);
        toast.success("Area berhasil diperbarui.");
      } else {
        await createArea(values, session.access_token);
        toast.success("Area baru berhasil dibuat.");
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
              <FormLabel>Nama Area</FormLabel>
              <FormControl>
                <Input placeholder="Area Pendingin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="warehouse_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gudang Induk</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih gudang..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const AddAreaButton = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <div className="">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Area
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Area Baru</DialogTitle>
          </DialogHeader>
          <AreaForm
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EditAreaButton = ({ area }: { area: Area }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="mr-2">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Area</DialogTitle>
        </DialogHeader>
        <AreaForm
          initialData={area}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export const AreaActionButtons = ({ area }: { area: Area }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // --- FUNGSI HANDLEDELETE YANG DIMODIFIKASI ---
  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Sesi tidak valid. Silakan login kembali.");
      setIsDeleting(false);
      return;
    }

    try {
      await deleteArea(area.id, session.access_token);
      toast.success(`Area "${area.name}" berhasil dihapus.`);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <EditAreaButton area={area} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive">
            Hapus
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Anda yakin ingin menghapus &quot;{area.name}&quot;?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Aksi ini tidak bisa dibatalkan. Ini akan menghapus area beserta
            semua perangkat di dalamnya.
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
