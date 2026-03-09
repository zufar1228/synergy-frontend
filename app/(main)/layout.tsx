// frontend/app/(main)/layout.tsx
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { WarehouseProvider } from '@/contexts/WarehouseContext';
import { DeviceStatusProvider } from '@/contexts/DeviceStatusContext';
import { AppSidebar } from '@/components/app-sidebar';
import { getMyProfile } from '@/lib/api';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
import { SWRProvider } from '@/components/providers/swr-provider';
import { SessionRefresh } from '@/components/session-refresh';
import { redirect } from 'next/navigation';
export default async function MainAppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const [
    {
      data: { user }
    },
    {
      data: { session }
    }
  ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

  if (!user || !session) {
    redirect('/login');
  }

  let userRole = 'user';
  let userEmail = '';

  if (user && session) {
    // Ambil role dari API backend, bukan dari JWT
    try {
      const profile = await getMyProfile(session.access_token);
      userRole = (profile as any).role || 'user';
    } catch (error) {
      console.error('Failed to fetch user profile for role:', error);
      userRole = 'user'; // fallback
    }
    userEmail = user.email || '';
  }

  const userData = {
    email: userEmail,
    avatar:
      user.user_metadata?.avatar_url || user.user_metadata?.picture || null
  };

  return (
    <WarehouseProvider>
      <DeviceStatusProvider>
        <SWRProvider>
          <SessionRefresh />
          <SidebarProvider>
            <div className="flex h-screen w-full bg-secondary">
              {/* Desktop Sidebar - hidden on mobile */}
              <div className="hidden lg:block">
                <AppSidebar userRole={userRole} user={userData} />
              </div>

              {/* Main Content Area */}
              <SidebarInset>
                <main className="flex-1 relative bg-grid-pattern overflow-hidden flex flex-col w-full">
                  <div className="absolute top-0 inset-x-0 z-50">
                    <SiteHeader userRole={userRole} user={userData} />
                  </div>
                  <div className="flex-1 overflow-y-auto pt-[72px] px-2.5 pb-4 md:pt-[88px] md:px-8 md:pb-8 w-full max-w-full">
                    <div className="mx-auto max-w-full md:max-w-7xl relative z-10">
                      {children}
                    </div>
                  </div>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </SWRProvider>
      </DeviceStatusProvider>
    </WarehouseProvider>
  );
}
