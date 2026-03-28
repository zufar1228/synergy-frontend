'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">Terjadi Kesalahan</h2>
      <p className="text-muted-foreground text-sm">
        Maaf, terjadi kesalahan saat memuat halaman ini.
      </p>
      <Button onClick={reset} variant="default">
        Coba Lagi
      </Button>
    </div>
  );
}
