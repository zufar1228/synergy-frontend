// frontend/app/(main)/management/areas/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAreas, Area } from "@/lib/api";
import {
  AddAreaButton,
  AreaActionButtons,
} from "@/components/actions/AreaActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ManageAreasPage() {
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

  // 4. Panggil fungsi API dengan menyertakan access_token
  const areas: Area[] = await getAreas(session.access_token);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Manajemen Area</h1>
      <div className="flex justify-start mb-6">
        <AddAreaButton />
      </div>
      <div className="rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Area</TableHead>
              <TableHead>Gudang Induk</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map((area) => (
              <TableRow key={area.id}>
                <TableCell className="font-medium">{area.name}</TableCell>
                <TableCell>{area.warehouse?.name || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <AreaActionButtons area={area} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
