"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  createDevice,
  updateDevice,
  deleteDevice,
  getWarehouses,
  getAreasByWarehouse,
  Warehouse,
  Area,
  Device,
  MqttCredentials,
} from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

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
import { PlusCircle, Copy } from "lucide-react";

// --- 1. Perbarui Skema Zod ---
const formSchema = z.object({
  name: z.string().min(3, { message: "Nama minimal 3 karakter." }),
  system_type: z.enum(["lingkungan", "gangguan", "keamanan", "medis_air", "intrusi", "proteksi_aset"], {
    message: "Tipe sistem wajib dipilih.",
  }),
  warehouse_id: z.string().min(1, "Gudang harus dipilih."),
  area_id: z.string().min(1, { message: "Area harus dipilih." }),
});

type DeviceFormData = z.infer<typeof formSchema>;

const CredentialsDisplay = ({
  credentials,
  onDone,
}: {
  credentials: MqttCredentials;
  onDone: () => void;
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin ke clipboard!`);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="p-4 bg-muted border border-border rounded-md text-muted-foreground">
        <p className="font-bold">Penting!</p>
        <p className="text-sm">
          Ini adalah satu-satunya saat Anda akan melihat password ini. Salin dan
          simpan di tempat yang aman sebelum menutup.
        </p>
      </div>
      <div className="space-y-2">
        {/* === PERBAIKAN: Gunakan <p> atau <div>, bukan <Label> === */}
        <p className="text-sm font-medium">MQTT Username</p>
        <div className="flex items-center gap-2">
          <Input readOnly value={credentials.username} className="font-mono" />
          <Button
            variant="default"
            size="icon"
            onClick={() => copyToClipboard(credentials.username, "Username")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {/* === PERBAIKAN: Gunakan <p> atau <div>, bukan <Label> === */}
        <p className="text-sm font-medium">MQTT Password</p>
        <div className="flex items-center gap-2">
          <Input readOnly value={credentials.password} className="font-mono" />
          <Button
            variant="default"
            size="icon"
            onClick={() => copyToClipboard(credentials.password, "Password")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <DialogFooter className="pt-4">
        <Button onClick={onDone}>Selesai</Button>
      </DialogFooter>
    </div>
  );
};

// --- 2. Perbarui DeviceForm ---
const DeviceForm = ({
  onSuccess,
  initialData,
}: {
  onSuccess: (credentials?: MqttCredentials | null) => void; // Update tipe prop
  initialData?: Device & { warehouse_id?: string };
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      system_type: (initialData?.system_type as any) || undefined,
      warehouse_id: initialData?.warehouse_id || undefined,
      area_id: initialData?.area_id || undefined,
    },
  });

  const selectedWarehouseId = form.watch("warehouse_id");

  // --- USEEFFECT UNTUK GET WAREHOUSES (DIMODIFIKASI) ---
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
      } catch (error) {
        toast.error("Gagal memuat data gudang.");
      }
    };
    fetchWarehouses();
  }, []);

  // --- USEEFFECT UNTUK GET AREAS (DIMODIFIKASI) ---
  useEffect(() => {
    const fetchAreas = async (warehouseId: string) => {
      setIsLoadingAreas(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesi tidak valid untuk memuat data area.");
        setIsLoadingAreas(false);
        return;
      }
      try {
        const data = await getAreasByWarehouse(
          warehouseId,
          session.access_token
        );
        setAreas(data);
      } catch (error) {
        toast.error("Gagal memuat data area.");
      } finally {
        setIsLoadingAreas(false);
      }
    };

    if (selectedWarehouseId) {
      fetchAreas(selectedWarehouseId);
    } else {
      setAreas([]);
    }
    form.setValue("area_id", "");
  }, [selectedWarehouseId, form]);

  async function onSubmit(values: DeviceFormData) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return toast.error("Sesi tidak valid.");

    try {
      if (initialData) {
        // Saat update, kita hanya kirim 'name' dan 'area_id'
        await updateDevice(
          initialData.id,
          {
            name: values.name,
            area_id: values.area_id,
          },
          session.access_token
        );

        toast.success("Perangkat berhasil diperbarui.");
        onSuccess(); // Panggil tanpa kredensial
      } else {
        // Saat create, kirim semua data
        const response = await createDevice(values, session.access_token);
        toast.success("Perangkat baru berhasil dibuat.");
        // Kirim kredensial (bisa jadi null) ke komponen induk
        onSuccess(response.mqttCredentials);
      }
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
              <FormLabel>Nama Perangkat</FormLabel>
              <FormControl>
                <Input placeholder="Sensor Suhu #1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* === 3. Ganti Input 'system_type' menjadi Select === */}
        <FormField
          control={form.control}
          name="system_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Sistem</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!!initialData} // Nonaktifkan saat mengedit
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe sistem..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="lingkungan">Lingkungan (MQTT)</SelectItem>
                  <SelectItem value="gangguan">Gangguan (MQTT)</SelectItem>
                  <SelectItem value="medis_air">Air Medis (MQTT)</SelectItem>
                  <SelectItem value="keamanan">Keamanan (Kamera)</SelectItem>
                  <SelectItem value="intrusi">Intrusi TinyML (MQTT)</SelectItem>
                  <SelectItem value="proteksi_aset">Proteksi Aset (ML Detection)</SelectItem>
                </SelectContent>
              </Select>
              {!!initialData && (
                <FormMessage>
                  Tipe sistem tidak dapat diubah setelah dibuat.
                </FormMessage>
              )}
              {!initialData && <FormMessage />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="warehouse_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gudang</FormLabel>
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
        <FormField
          control={form.control}
          name="area_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedWarehouseId || isLoadingAreas}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingAreas ? "Memuat..." : "Pilih area..."
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
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

// --- 4. Perbarui Logika 'AddDeviceButton' ---
export const AddDeviceButton = () => {
  const [open, setOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState<MqttCredentials | null>(
    null
  );
  const router = useRouter();

  const handleCloseAndRefresh = () => {
    setOpen(false);
    setNewCredentials(null);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setNewCredentials(null);
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Perangkat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {!newCredentials
              ? "Tambah Perangkat Baru"
              : "Kredensial MQTT Dibuat"}
          </DialogTitle>
        </DialogHeader>

        {!newCredentials ? (
          <DeviceForm
            onSuccess={(credentials) => {
              // Jika 'credentials' ada (bukan null atau undefined), tampilkan
              if (credentials) {
                setNewCredentials(credentials);
              } else {
                // Jika null (kasus perangkat 'keamanan'), langsung tutup
                handleCloseAndRefresh();
              }
            }}
          />
        ) : (
          <CredentialsDisplay
            credentials={newCredentials}
            onDone={handleCloseAndRefresh}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

// --- 5. Perbarui 'EditDeviceButton' agar pass data awal dengan benar ---
const EditDeviceButton = ({ device }: { device: Device }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Siapkan data awal untuk form, termasuk warehouse_id
  const initialDataForForm = {
    ...device,
    warehouse_id: device.area?.warehouse.id,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="neutral" size="sm" className="mr-2">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Perangkat</DialogTitle>
        </DialogHeader>
        <DeviceForm
          initialData={initialDataForForm as any}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

// --- KOMPONEN DEVICEACTIONBUTTONS (DIMODIFIKASI) ---
export const DeviceActionButtons = ({ device }: { device: Device }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

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
      await deleteDevice(device.id, session.access_token);
      toast.success("Perangkat berhasil dihapus.");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <EditDeviceButton device={device} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            Hapus
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Anda yakin ingin menghapus "{device.name}"?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Aksi ini tidak bisa dibatalkan.
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
