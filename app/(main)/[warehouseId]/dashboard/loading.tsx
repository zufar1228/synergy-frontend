// frontend/app/(main)/[warehouseId]/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function WarehouseDashboardLoading() {
  return (
    <div>
      {/* Skeleton untuk Judul Halaman */}
      <Skeleton className="h-10 w-1/2 mb-2" />
      <Skeleton className="h-6 w-1/4 mb-8" />

      {/* Skeleton untuk Kartu Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
