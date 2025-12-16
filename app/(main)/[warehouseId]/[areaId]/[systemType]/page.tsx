// frontend/app/(main)/[warehouseId]/[areaId]/[systemType]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LingkunganView } from "@/components/analytics/LingkunganView";
import { GangguanView } from "@/components/analytics/GangguanView";
import { KeamananView } from "@/components/analytics/KeamananView";
import { IntrusiView } from "@/components/analytics/IntrusiView";

// Update getAnalytics function definition
async function getAnalytics(
  accessToken: string,
  params: {
    systemType: string;
    areaId: string;
    page?: string;
    perPage?: string;
    from?: string;
    to?: string;
  }
) {
  try {
    const query = new URLSearchParams();
    query.append("area_id", params.areaId);
    if (params.page) query.append("page", params.page);
    if (params.perPage) query.append("per_page", params.perPage);
    if (params.from) query.append("from", params.from);
    if (params.to) query.append("to", params.to);

    const url =
      process.env.NEXT_PUBLIC_API_URL +
      `/api/analytics/${params.systemType}?${query.toString()}`;
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
  searchParams: {
    page?: string;
    per_page?: string;
    from?: string;
    to?: string;
  }; // <-- Add from/to
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

  // Pass all relevant searchParams to the fetch function
  const data = await getAnalytics(session.access_token, {
    systemType,
    areaId,
    page: page,
    perPage: perPage,
    from: awaitedSearchParams.from,
    to: awaitedSearchParams.to,
  });

  if (!data) {
    return <div className="text-center">Gagal memuat data analitik.</div>;
  }

  const renderAnalyticsView = () => {
    switch (systemType) {
      case "lingkungan":
        return <LingkunganView initialData={data} />;
      case "gangguan":
        return <GangguanView initialData={data} />;
      case "keamanan":
        return <KeamananView initialData={data} />;
      case "intrusi":
        return <IntrusiView deviceId={data.deviceId} initialData={data} />;
      default:
        return (
          <div className="text-center">
            Tampilan analitik untuk tipe sistem '{systemType}' belum tersedia.
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6 capitalize">
        Analitik Sistem: {systemType.replace("_", " ")}
      </h1>
      {renderAnalyticsView()}
    </div>
  );
}
