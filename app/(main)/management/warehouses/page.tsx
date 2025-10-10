// frontend/app/(main)/management/warehouses/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AddWarehouseButton,
  WarehouseActionButtons,
} from "@/components/actions/WarehouseActions";
import { Warehouse, getWarehouses } from "@/lib/api"; // <-- Impor getWarehouses dari lib/api

// Fungsi getWarehouses lokal yang lama sudah dihapus

export default async function ManageWarehousesPage() {
  // 1. Buat Supabase client untuk server
  const supabase = await createClient();

  // 2. Dapatkan sesi pengguna
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 3. Jika tidak ada sesi, alihkan ke halaman login
  if (!session) {
    redirect("/login");
  }

  // 4. Panggil fungsi API terpusat dengan access_token
  const warehouses: Warehouse[] = await getWarehouses(session.access_token);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Gudang</h1>
        <AddWarehouseButton />
      </div>

      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <TableCell className="font-medium">{warehouse.name}</TableCell>
                <TableCell>{warehouse.location || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <WarehouseActionButtons warehouse={warehouse} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
