// frontend/components/site-header.tsx
'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { ThemeToggle } from './theme-toggle';
import { HeaderBreadcrumbs } from './header-breadcrumbs';

interface UserData {
  username?: string;
  email: string;
  avatar?: string | null;
}

export function SiteHeader({
  user,
  userRole
}: {
  user: UserData;
  userRole: string;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 bg-secondary-background/80 backdrop-blur-sm px-4 lg:px-6 border-b-3 border-b-sidebar-border">
      {/* Sidebar Trigger for Desktop */}
      <div className="hidden lg:flex">
        <SidebarTrigger className="-ml-1" suppressHydrationWarning />
      </div>

      {/* Tombol Sidebar Mobile: hanya tampil di layar kecil */}
      <div className="lg:hidden" suppressHydrationWarning>
        <MobileSidebar user={user} userRole={userRole} />
      </div>

      <Separator
        orientation="vertical"
        className="mx-1"
        style={{ width: '2.5px' }}
      />

      {/* Logo */}
      <div className="flex items-center -ml-1">
        <Image
          src="/logo_header-dark.png"
          alt="Synergy IOT"
          width={120}
          height={32}
          priority
          unoptimized
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}

export function SiteHeaderSkeleton() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 bg-secondary-background/80 backdrop-blur-sm px-4 lg:px-6 border-b-3 border-b-sidebar-border">
      {/* Sidebar Trigger Placeholder */}
      <div className="hidden lg:flex">
        <Skeleton className="h-6 w-6 rounded" />
      </div>

      {/* Mobile Sidebar Placeholder */}
      <div className="lg:hidden">
        <Skeleton className="h-6 w-6 rounded" />
      </div>

      <Separator
        orientation="vertical"
        className="mx-3 w-[3px] h-10 bg-gray-400"
      />
      <Skeleton className="h-4 w-16" />

      {/* Theme Toggle Placeholder */}
      <div className="ml-auto flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </header>
  );
}
