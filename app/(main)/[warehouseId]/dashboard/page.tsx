// frontend/app/(main)/[warehouseId]/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import Link from "next/link";

// Tipe data (bisa diimpor dari file lain)
interface ActiveSystem {
  system_type: string;
  device_count: number;
}
interface AreaDetail {
  id: string;
  name: string;
  active_systems: ActiveSystem[];
}
interface WarehouseDetails {
  id: string;
  name: string;
  location: string | null;
  areas: AreaDetail[];
}

// PERUBAHAN 1: Fungsi untuk mengambil data sekarang menerima access token
async function getWarehouseDetails(
  id: string,
  accessToken: string // <-- Token ditambahkan sebagai parameter
): Promise<WarehouseDetails | null> {
  try {
    const res = await fetch(
      `http://localhost:5001/api/warehouses/${id}/areas-with-systems`,
      {
        cache: "no-store",
        headers: {
          // <-- Header Authorization ditambahkan
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch warehouse details:", error);
    return null;
  }
}

// Komponen Halaman
export default async function WarehouseDashboardPage({
  params,
}: {
  params: { warehouseId: string };
}) {
  // PERUBAHAN 2: Tambahkan pengecekan sesi autentikasi
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { warehouseId } = await params;
  // PERUBAHAN 3: Kirim token saat memanggil fungsi
  const warehouse = await getWarehouseDetails(
    warehouseId,
    session.access_token
  );

  // Menangani state jika gudang tidak ditemukan
  if (!warehouse) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Gudang Tidak Ditemukan</h1>
        <p className="text-gray-500">
          Gudang dengan ID yang Anda cari tidak ada atau Anda tidak memiliki
          akses.
        </p>
        <Link href="/dashboard" className="text-blue-600 mt-4 inline-block">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">{warehouse.name}</h1>
      {warehouse.location && (
        <p className="text-lg text-gray-500 flex items-center gap-2 mb-8">
          <MapPin className="w-5 h-5" />
          {warehouse.location}
        </p>
      )}

      <h2 className="text-2xl font-semibold mb-4">Daftar Area</h2>

      {warehouse.areas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouse.areas.map((area) => (
            <Card key={area.id}>
              <CardHeader>
                <CardTitle>{area.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <h4 className="font-semibold text-sm">Sistem Aktif:</h4>
                {area.active_systems.length > 0 ? (
                  area.active_systems.map((system) => (
                    <Link
                      href={`/${warehouse.id}/${area.id}/${system.system_type}`}
                      key={system.system_type}
                      className="flex justify-between p-2 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <span className="capitalize">{system.system_type}</span>
                      <span className="font-bold">
                        {system.device_count} Perangkat
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Tidak ada sistem aktif.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center mt-10 p-6 border rounded-lg">
          <h3 className="text-xl font-semibold">Belum Ada Area</h3>
          <p className="text-gray-500 mt-2">
            Tambahkan area baru untuk gudang ini di halaman management.
          </p>
        </div>
      )}
    </div>
  );
}
