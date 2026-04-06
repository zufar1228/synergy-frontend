// frontend/components/demo-button.tsx
'use client';

import { useState } from 'react';
import { startDemo } from '@/app/login/demo-action';
import { Button } from '@/components/ui/button';
import { Eye, LoaderCircleIcon } from 'lucide-react';

export function DemoButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDemo = async () => {
    setIsLoading(true);
    try {
      const result = await startDemo();
      if (result.success) {
        // Use window.location for a full navigation to ensure cookies are picked up
        window.location.href = '/dashboard';
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="neutral"
      onClick={handleDemo}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
          Memuat Demo...
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          Coba Demo
        </>
      )}
    </Button>
  );
}
