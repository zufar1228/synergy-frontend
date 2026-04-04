'use client';

import { useEffect } from 'react';

export default function LoginError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[LoginError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">Gagal Memuat Halaman Login</h2>
      <p className="text-muted-foreground text-sm">
        Terjadi kesalahan. Silakan coba lagi.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
      >
        Coba Lagi
      </button>
    </div>
  );
}
