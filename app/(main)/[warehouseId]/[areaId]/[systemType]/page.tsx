// frontend/app/(main)/[warehouseId]/[areaId]/[systemType]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { KeamananView } from '@/components/analytics/KeamananView';
import { IntrusiView } from '@/components/analytics/IntrusiView';
import { LingkunganView } from '@/components/analytics/LingkunganView';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    query.append('area_id', params.areaId);
    if (params.page) query.append('page', params.page);
    if (params.perPage) query.append('per_page', params.perPage);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);

    const url =
      process.env.NEXT_PUBLIC_API_URL +
      `/api/analytics/${params.systemType}?${query.toString()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return null;
  }
}

// Komponen Halaman Server yang bertindak sebagai dispatcher
export default async function AnalyticsPage({
  params,
  searchParams
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
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) return redirect('/login');

  // --- PERBAIKAN: Await params sebelum mengakses properties ---
  const awaitedParams = await params;
  const { systemType, areaId } = awaitedParams;

  // --- PERBAIKAN 3: Await searchParams sebelum mengakses properties ---
  const awaitedSearchParams = await searchParams;
  const page = awaitedSearchParams.page || '1';
  const perPage = awaitedSearchParams.per_page || '25';

  // Pass all relevant searchParams to the fetch function
  const data = await getAnalytics(session.access_token, {
    systemType,
    areaId,
    page: page,
    perPage: perPage,
    from: awaitedSearchParams.from,
    to: awaitedSearchParams.to
  });

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-heading mb-1">Gagal Memuat Data</h2>
        <p className="text-muted-foreground text-sm max-w-xs mb-4">
          Terjadi kesalahan saat mengambil data analitik. Silakan coba lagi.
        </p>
        <a
          href={`/${awaitedParams.warehouseId}/${areaId}/${systemType}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-main hover:underline"
        >
          <RefreshCw className="h-4 w-4" /> Muat Ulang
        </a>
      </div>
    );
  }

  const renderAnalyticsView = () => {
    switch (systemType) {
      case 'keamanan':
        return <KeamananView initialData={data} />;
      case 'intrusi':
        return <IntrusiView initialData={data} />;
      case 'lingkungan':
        return <LingkunganView initialData={data} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-heading mb-1">
              Tampilan Belum Tersedia
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Analitik untuk tipe sistem &apos;{systemType}&apos; belum
              tersedia.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {/* page heading removed as per request */}
      {renderAnalyticsView()}
    </div>
  );
}
