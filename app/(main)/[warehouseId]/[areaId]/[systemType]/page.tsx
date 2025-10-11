// frontend/app/(main)/[warehouseId]/[areaId]/[systemType]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LingkunganView } from "@/components/analytics/LingkunganView";
import { GangguanView } from "@/components/analytics/GangguanView";

// --- PERBAIKAN 1: Update definisi fungsi untuk menerima 'perPage' ---
async function getAnalytics(
  accessToken: string,
  systemType: string,
  areaId: string,
  page: string = "1",
  perPage: string = "25" // Tambahkan parameter perPage
) {
  try {
    // --- PERBAIKAN 2: Tambahkan parameter per_page ke URL fetch ---
    const url =
      process.env.NEXT_PUBLIC_API_URL +
      `/api/analytics/${systemType}?area_id=${areaId}&page=${page}&per_page=${perPage}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return null;
  }
}

// Komponen Halaman Server yang bertindak sebagai dispatcher
export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: { warehouseId: string; areaId: string; systemType: string };
  searchParams: { page?: string; per_page?: string }; // <-- Tambahkan per_page di sini
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return redirect("/login");

  // --- PERBAIKAN: Await params sebelum mengakses properties ---
  const awaitedParams = await params;
  const { systemType, areaId } = awaitedParams;

  // --- PERBAIKAN 3: Await searchParams sebelum mengakses properties ---
  const awaitedSearchParams = await searchParams;
  const page = awaitedSearchParams.page || "1";
  const perPage = awaitedSearchParams.per_page || "25";

  // --- PERBAIKAN 4: Teruskan 'perPage' saat memanggil fungsi ---
  const data = await getAnalytics(
    session.access_token,
    systemType,
    areaId,
    page,
    perPage
  );

  if (!data) {
    return <div className="text-center">Gagal memuat data analitik.</div>;
  }

  if (data.logs.length === 0) {
    return <div className="text-center">Tidak ada data untuk sistem ini.</div>;
  }

  const renderAnalyticsView = () => {
    switch (systemType) {
      case "lingkungan":
        return <LingkunganView initialData={data} />;
      case "gangguan":
        return <GangguanView initialData={data} />;
      default:
        return (
          <div className="text-center">
            Tampilan analitik untuk tipe sistem '{systemType}' belum tersedia.
          </div>
        );
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 capitalize">
        Analitik Sistem: {systemType.replace("_", " ")}
      </h1>
      {renderAnalyticsView()}
    </div>
  );
}
