/**
 * @file global-error.tsx
 * @purpose Global error boundary for unhandled errors with mobile-safe full-height centering
 * @usedBy Next.js app router
 * @deps None
 * @exports GlobalError (default)
 * @sideEffects None
 */

'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh',
            gap: '1rem',
            fontFamily: 'system-ui, sans-serif'
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            Terjadi Kesalahan
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Maaf, terjadi kesalahan yang tidak terduga.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              backgroundColor: '#0f172a',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
