/**
 * @file page.tsx
 * @purpose System-specific monitoring page — renders keamanan/intrusi/lingkungan view
 * @usedBy Next.js app router (/[warehouseId]/[areaId]/[systemType])
 * @deps KeamananView, IntrusiView, LingkunganView, AnimatedPageTitle
 * @exports SystemPage (default)
 * @sideEffects API calls (feature-specific data)
 */

// frontend/app/(main)/[warehouseId]/[areaId]/[systemType]/page.tsx
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAnalytics } from '@/lib/api/analytics';
import { getDemoAnalytics } from '@/lib/demo/mock-data';

import { KeamananView } from '@/features/keamanan/components/KeamananView';
import { IntrusiView } from '@/features/intrusi/components/IntrusiView';
import { LingkunganView } from '@/features/lingkungan/components/LingkunganView';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    status?: string;
    event_type?: string;
    system_state?: string;
    door_state?: string;
  }; // <-- Add from/to and filters
}) {
  // --- Await params before accessing properties ---
  const awaitedParams = await params;
  const { systemType, areaId } = awaitedParams;
  const awaitedSearchParams = await searchParams;
  const page = awaitedSearchParams.page || '1';
  const perPage = awaitedSearchParams.per_page || '25';

  const cookieStore = await cookies();
  const isDemoMode = cookieStore.get('demo-mode')?.value === 'true';

  let data: any = null;

  if (isDemoMode) {
    // Demo mode: return mock analytics data
    data = getDemoAnalytics(systemType, areaId);
  } else {
    // Normal mode: Supabase auth + real API
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) return redirect('/login');

    data = await getAnalytics(session.access_token, {
      systemType,
      areaId,
      page,
      perPage,
      from: awaitedSearchParams.from,
      to: awaitedSearchParams.to,
      status: awaitedSearchParams.status,
      eventType: awaitedSearchParams.event_type,
      systemState: awaitedSearchParams.system_state,
      doorState: awaitedSearchParams.door_state
    });
  }

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
