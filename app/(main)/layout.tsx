/**
 * @file layout.tsx
 * @purpose Main authenticated shell — sidebar, viewport-pinned mobile header, and scroll container for protected pages
 * @usedBy All authenticated pages
 * @deps AppSidebar, SiteHeader, SessionRefresh, WarehouseProvider, DeviceStatusProvider, QueryProvider
 * @exports MainAppLayout (default)
 * @sideEffects Server-side auth/session checks, unauthenticated redirect, periodic session refresh
 */

// frontend/app/(main)/layout.tsx
import React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { WarehouseProvider } from '@/contexts/WarehouseContext';
import { DeviceStatusProvider } from '@/contexts/DeviceStatusContext';
import { AppSidebar } from '@/components/app-sidebar';
import { getMyProfile } from '@/lib/api';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import { QueryProvider } from '@/components/providers/query-provider';
import { SessionRefresh } from '@/components/session-refresh';
import { DemoProvider } from '@/lib/demo/context';
import { DEMO_PROFILE } from '@/lib/demo/mock-data';
import { redirect } from 'next/navigation';
export default async function MainAppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isDemoMode = cookieStore.get('demo-mode')?.value === 'true';

  let userRole = 'user';
  let userEmail = '';
  let userAvatar: string | null = null;

  if (isDemoMode) {
    // Demo mode: use mock profile
    userRole = DEMO_PROFILE.role;
    userEmail = DEMO_PROFILE.email;
    userAvatar = DEMO_PROFILE.avatar_url;
  } else {
    // Normal mode: Supabase auth
    const supabase = await createClient();

    const [
      {
        data: { user }
      },
      {
        data: { session }
      }
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession()
    ]);

    if (!user || !session) {
      redirect('/login');
    }

    if (user && session) {
      try {
        const profile = await getMyProfile(session.access_token);
        userRole = (profile as any).role || 'user';
      } catch (error) {
        console.error('Failed to fetch user profile for role:', error);
        userRole = 'user';
      }
      userEmail = user.email || '';
      userAvatar =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
    }
  }

  const userData = {
    email: userEmail,
    avatar: userAvatar
  };

  return (
    <DemoProvider isDemo={isDemoMode}>
      <WarehouseProvider>
        <DeviceStatusProvider>
          <QueryProvider>
            {!isDemoMode && <SessionRefresh />}
            <SidebarProvider>
              <div className="flex min-h-dvh w-full bg-secondary lg:h-screen">
                {/* Desktop Sidebar - hidden on mobile */}
                <div className="hidden lg:block">
                  <AppSidebar userRole={userRole} user={userData} />
                </div>

                {/* Main Content Area */}
                <SidebarInset>
                  <main className="flex-1 relative bg-grid-pattern overflow-visible lg:overflow-hidden flex flex-col w-full">
                    <div className="fixed top-0 inset-x-0 z-50 lg:absolute">
                      <SiteHeader userRole={userRole} user={userData} />
                    </div>
                    <div className="flex-1 overflow-visible pt-[72px] px-2.5 pb-4 md:pt-[88px] md:px-8 md:pb-8 w-full max-w-full lg:overflow-y-auto">
                      <div className="mx-auto max-w-full md:max-w-7xl relative z-10">
                        {children}
                      </div>
                    </div>
                  </main>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </QueryProvider>
        </DeviceStatusProvider>
      </WarehouseProvider>
    </DemoProvider>
  );
}
