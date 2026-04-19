/**
 * @file app-navigation.tsx
 * @purpose Desktop navigation menu with system-type grouped area links
 * @usedBy MainLayout
 * @deps useNavAreas, useWarehouse, navigation-menu UI
 * @exports AppNavigation (default)
 * @sideEffects None
 */

// frontend/components/app-navigation.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  LayoutDashboard,
  Settings,
  Users,
  Building,
  HardDrive,
  AreaChart,
  Camera,
  DoorOpen,
  Thermometer
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useNavAreas } from '@/hooks/use-nav-areas';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function to render area name with warehouse info when needed
const renderAreaName = (
  area: { name: string; warehouse_name?: string },
  selectedWarehouse: string | null
) => {
  const displayText =
    selectedWarehouse === 'all' && area.warehouse_name
      ? `${area.warehouse_name} - ${area.name}`
      : area.name;

  return (
    <span
      className="inline-block whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
      title={displayText} // Show full text on hover
    >
      {displayText}
    </span>
  );
};

// Define navigation data
const mainLinks = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Profil', href: '/profile', icon: Settings }
];

const managementLinks = [
  { title: 'Gudang', href: '/management/warehouses', icon: Building },
  { title: 'Area', href: '/management/areas', icon: AreaChart },
  { title: 'Perangkat', href: '/management/devices', icon: HardDrive },
  { title: 'Pengguna', href: '/management/users', icon: Users }
];

const AppNavigationComponent = ({ userRole }: { userRole: string }) => {
  const pathname = usePathname();
  const { selectedWarehouse } = useWarehouse();
  const { securityAreas, intrusiAreas, lingkunganAreas, isLoading } =
    useNavAreas();

  // track the very first render (used for hydration consistency)
  const [initialLoad, setInitialLoad] = React.useState(true);
  React.useEffect(() => {
    setInitialLoad(false);
  }, []);

  // Memoize filtered environment areas to avoid recalculation on every render

  // Memoize filtered security areas to avoid recalculation on every render
  const filteredSecurityAreas = useMemo(() => {
    return securityAreas.filter(
      (area) =>
        selectedWarehouse === 'all' || area.warehouse_id === selectedWarehouse
    );
  }, [securityAreas, selectedWarehouse]);

  // Memoize filtered intrusi areas
  const filteredIntrusiAreas = useMemo(() => {
    return intrusiAreas.filter(
      (area) =>
        selectedWarehouse === 'all' || area.warehouse_id === selectedWarehouse
    );
  }, [intrusiAreas, selectedWarehouse]);

  // Memoize filtered lingkungan areas
  const filteredLingkunganAreas = useMemo(() => {
    return lingkunganAreas.filter(
      (area) =>
        selectedWarehouse === 'all' || area.warehouse_id === selectedWarehouse
    );
  }, [lingkunganAreas, selectedWarehouse]);

  // Memoize the isActive function to avoid recreation on every render
  const isActive = useCallback(
    (href: string) => {
      if (href === '/dashboard' || href === '/profile') {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(href + '/');
    },
    [pathname]
  );

  // determine which monitoring groups actually have items after warehouse filter
  // section visibility: show when data exists **or** during the initial load to
  // keep server and client markup identical. Switching off after hydration
  // prevents hydration mismatches when async data arrives.
  const hasSecurity = initialLoad || filteredSecurityAreas.length > 0;
  const hasIntrusi = initialLoad || filteredIntrusiAreas.length > 0;
  const hasLingkungan = initialLoad || filteredLingkunganAreas.length > 0;
  const hasMonitoring = hasSecurity || hasIntrusi || hasLingkungan;
  const showMonitoringHeader = initialLoad || hasMonitoring;

  // Check if any environment sub-menu is active

  // Check if any security sub-menu is active
  const isSecurityActive = useMemo(() => {
    return filteredSecurityAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/keamanan`
    );
  }, [filteredSecurityAreas, pathname]);

  // Check if any intrusi sub-menu is active
  const isIntrusiActive = useMemo(() => {
    return filteredIntrusiAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/intrusi`
    );
  }, [filteredIntrusiAreas, pathname]);

  // Check if any lingkungan sub-menu is active
  const isLingkunganActive = useMemo(() => {
    return filteredLingkunganAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/lingkungan`
    );
  }, [filteredLingkunganAreas, pathname]);

  // Memoize management links filtering
  const filteredManagementLinks = useMemo(() => {
    return managementLinks.filter((link) => {
      if (link.href === '/management/users') {
        return userRole === 'super_admin';
      }
      return true;
    });
  }, [userRole]);

  const showManagement = ['admin', 'super_admin'].includes(userRole);

  return (
    <>
      <SidebarGroup className="mb-3 pt-0 border-t-0">
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu className="gap-3 my-2">
          {mainLinks.map((link) => (
            <SidebarMenuItem key={link.title}>
              <SidebarMenuButton asChild isActive={isActive(link.href)}>
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Monitoring group header shown during initial load or if any section exists */}
      {showMonitoringHeader && (
        <SidebarGroup className="mb-3">
          <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
          <SidebarMenu className="gap-3 my-2">
            {/* Collapsible Security Menu (render during initialLoad or if data) */}
            {hasSecurity && (
              <Collapsible asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      suppressHydrationWarning
                      isActive={isSecurityActive}
                    >
                      <Camera />
                      <span>Keamanan</span>
                      <ChevronRight className="ml-auto transition-transform duration-150 ease-out group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent suppressHydrationWarning>
                    <SidebarMenuSub>
                      {isLoading
                        ? // Show skeleton while loading
                          Array.from({ length: 3 }).map((_, i) => (
                            <SidebarMenuSubItem key={i}>
                              <SidebarMenuSubButton>
                                <Skeleton className="h-4 w-24" />
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))
                        : filteredSecurityAreas.map((area) => (
                            <SidebarMenuSubItem key={area.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={
                                  pathname ===
                                  `/${area.warehouse_id}/${area.id}/keamanan`
                                }
                              >
                                <Link
                                  href={`/${area.warehouse_id}/${area.id}/keamanan`}
                                >
                                  {renderAreaName(area, selectedWarehouse)}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}
            {/* Collapsible Lingkungan Menu */}
            {hasLingkungan && (
              <Collapsible asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      suppressHydrationWarning
                      isActive={isLingkunganActive}
                    >
                      <Thermometer />
                      <span>Lingkungan</span>
                      <ChevronRight className="ml-auto transition-transform duration-150 ease-out group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent suppressHydrationWarning>
                    <SidebarMenuSub>
                      {isLoading
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <SidebarMenuSubItem key={i}>
                              <SidebarMenuSubButton>
                                <Skeleton className="h-4 w-24" />
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))
                        : filteredLingkunganAreas.map((area) => (
                            <SidebarMenuSubItem key={area.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={
                                  pathname ===
                                  `/${area.warehouse_id}/${area.id}/lingkungan`
                                }
                              >
                                <Link
                                  href={`/${area.warehouse_id}/${area.id}/lingkungan`}
                                >
                                  {renderAreaName(area, selectedWarehouse)}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}
            {/* Collapsible Intrusi Menu */}
            {hasIntrusi && (
              <Collapsible asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      suppressHydrationWarning
                      isActive={isIntrusiActive}
                    >
                      <DoorOpen />
                      <span>Intrusi Pintu</span>
                      <ChevronRight className="ml-auto transition-transform duration-150 ease-out group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent suppressHydrationWarning>
                    <SidebarMenuSub>
                      {isLoading
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <SidebarMenuSubItem key={i}>
                              <SidebarMenuSubButton>
                                <Skeleton className="h-4 w-24" />
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))
                        : filteredIntrusiAreas.map((area) => (
                            <SidebarMenuSubItem key={area.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={
                                  pathname ===
                                  `/${area.warehouse_id}/${area.id}/intrusi`
                                }
                              >
                                <Link
                                  href={`/${area.warehouse_id}/${area.id}/intrusi`}
                                >
                                  {renderAreaName(area, selectedWarehouse)}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}
          </SidebarMenu>
        </SidebarGroup>
      )}

      {showManagement && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Manajemen</SidebarGroupLabel>
          <SidebarMenu className="gap-3 my-2">
            {filteredManagementLinks.map((link) => (
              <SidebarMenuItem key={link.title}>
                <SidebarMenuButton asChild isActive={isActive(link.href)}>
                  <Link href={link.href}>
                    <link.icon />
                    <span>{link.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  );
};

AppNavigationComponent.displayName = 'AppNavigation';

export const AppNavigation = React.memo(AppNavigationComponent);

export function AppNavigationSkeleton({ userRole }: { userRole: string }) {
  return (
    <>
      {/* Platform Section */}
      <SidebarGroup className="mb-3 pt-0 border-t-0">
        <SidebarGroupLabel>
          <Skeleton className="h-4 w-16" />
        </SidebarGroupLabel>
        <SidebarMenu>
          {Array.from({ length: 2 }).map((_, i) => (
            <SidebarMenuItem key={i}>
              <SidebarMenuButton>
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-20" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Monitoring Section */}
      <SidebarGroup className="mb-3">
        <SidebarGroupLabel>
          <Skeleton className="h-4 w-20" />
        </SidebarGroupLabel>
        <SidebarMenu className="gap-3 my-2">
          {/* Environment Menu Skeleton */}
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-16" />
              <ChevronRight className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
            <SidebarMenuSub>
              {Array.from({ length: 3 }).map((_, i) => (
                <SidebarMenuSubItem key={i}>
                  <SidebarMenuSubButton>
                    <Skeleton className="h-4 w-24" />
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </SidebarMenuItem>
          {/* Security Menu Skeleton */}
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-16" />
              <ChevronRight className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
            <SidebarMenuSub>
              {Array.from({ length: 3 }).map((_, i) => (
                <SidebarMenuSubItem key={i}>
                  <SidebarMenuSubButton>
                    <Skeleton className="h-4 w-24" />
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* Management Section - only for admin/super_admin */}
      {['admin', 'super_admin'].includes(userRole) && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>
            <Skeleton className="h-4 w-24" />
          </SidebarGroupLabel>
          <SidebarMenu>
            {Array.from({ length: userRole === 'super_admin' ? 4 : 3 }).map(
              (_, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton>
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-20" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  );
}
