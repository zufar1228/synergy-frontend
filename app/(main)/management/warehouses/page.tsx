// frontend/app/(main)/management/warehouses/page.tsx
import { cookies } from "next/headers";
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
import { Warehouse, getWarehouses } from "@/lib/api";
import { DEMO_WAREHOUSES } from "@/lib/demo/mock-data";

export default async function ManageWarehousesPage() {
  const cookieStore = await cookies();
  const isDemoMode = cookieStore.get('demo-mode')?.value === 'true';

  let warehouses: Warehouse[] = [];

  if (isDemoMode) {
    warehouses = DEMO_WAREHOUSES as any;
  } else {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      redirect("/login");
    }
    warehouses = await getWarehouses(session.access_token);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6">
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
