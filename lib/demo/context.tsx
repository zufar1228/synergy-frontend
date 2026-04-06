// frontend/lib/demo/context.tsx
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface DemoContextType {
  isDemo: boolean;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType>({ isDemo: false, exitDemo: () => {} });

export function DemoProvider({ isDemo, children }: { isDemo: boolean; children: ReactNode }) {
  const [demo, setDemo] = useState(isDemo);

  const exitDemo = () => {
    // Clear the cookie
    document.cookie = 'demo-mode=; path=/; max-age=0';
    setDemo(false);
    window.location.href = '/login';
  };

  return (
    <DemoContext.Provider value={{ isDemo: demo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextType {
  return useContext(DemoContext);
}
