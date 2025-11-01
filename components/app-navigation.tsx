// frontend/components/app-navigation.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  LayoutDashboard,
  Settings,
  Users,
  Building,
  HardDrive,
  AreaChart,
  AlertTriangle,
  Thermometer,
  Camera,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { createClient } from "@/lib/supabase/client";
import { getNavAreasBySystem, NavArea } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// Define navigation data
const mainLinks = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Profil", href: "/profile", icon: Settings },
];

const managementLinks = [
  { title: "Gudang", href: "/management/warehouses", icon: Building },
  { title: "Area", href: "/management/areas", icon: AreaChart },
  { title: "Perangkat", href: "/management/devices", icon: HardDrive },
  { title: "Pengguna", href: "/management/users", icon: Users },
];

const AppNavigationComponent = ({ userRole }: { userRole: string }) => {
  const pathname = usePathname();
  const { selectedWarehouse } = useWarehouse();
  const [incidentAreas, setIncidentAreas] = useState<NavArea[]>([]);
  const [environmentAreas, setEnvironmentAreas] = useState<NavArea[]>([]);
  const [securityAreas, setSecurityAreas] = useState<NavArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNavData = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }
      try {
        // Fetch data for both systems simultaneously
        const [incidentData, environmentData, securityData] = await Promise.all(
          [
            getNavAreasBySystem("gangguan", session.access_token),
            getNavAreasBySystem("lingkungan", session.access_token),
            getNavAreasBySystem("keamanan", session.access_token),
          ]
        );
        setIncidentAreas(incidentData);
        setEnvironmentAreas(environmentData);
        setSecurityAreas(securityData);
      } catch (error) {
        console.error("Failed to load navigation areas:", error);
        // Don't show toast on every render, just log the error
      } finally {
        setIsLoading(false);
      }
    };

    fetchNavData();
  }, []); // Only fetch once on mount

  // Memoize filtered incident areas to avoid recalculation on every render
  const filteredIncidentAreas = useMemo(() => {
    return incidentAreas.filter(
      (area) =>
        selectedWarehouse === "all" || area.warehouse_id === selectedWarehouse
    );
  }, [incidentAreas, selectedWarehouse]);

  // Memoize filtered environment areas to avoid recalculation on every render
  const filteredEnvironmentAreas = useMemo(() => {
    return environmentAreas.filter(
      (area) =>
        selectedWarehouse === "all" || area.warehouse_id === selectedWarehouse
    );
  }, [environmentAreas, selectedWarehouse]);

  // Memoize filtered security areas to avoid recalculation on every render
  const filteredSecurityAreas = useMemo(() => {
    return securityAreas.filter(
      (area) =>
        selectedWarehouse === "all" || area.warehouse_id === selectedWarehouse
    );
  }, [securityAreas, selectedWarehouse]);

  // Memoize the isActive function to avoid recreation on every render
  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard" || href === "/profile") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  // Check if any environment sub-menu is active
  const isEnvironmentActive = useMemo(() => {
    return filteredEnvironmentAreas.some(area =>
      pathname === `/${area.warehouse_id}/${area.id}/lingkungan`
    );
  }, [filteredEnvironmentAreas, pathname]);

  // Check if any security sub-menu is active
  const isSecurityActive = useMemo(() => {
    return filteredSecurityAreas.some(area =>
      pathname === `/${area.warehouse_id}/${area.id}/keamanan`
    );
  }, [filteredSecurityAreas, pathname]);

  // Check if any incident sub-menu is active
  const isIncidentActive = useMemo(() => {
    return filteredIncidentAreas.some(area =>
      pathname === `/${area.warehouse_id}/${area.id}/gangguan`
    );
  }, [filteredIncidentAreas, pathname]);

  // Memoize management links filtering
  const filteredManagementLinks = useMemo(() => {
    return managementLinks.filter((link) => {
      if (link.href === "/management/users") {
        return userRole === "super_admin";
      }
      return true;
    });
  }, [userRole]);

  const showManagement = ["admin", "super_admin"].includes(userRole);

  return (
    <>
      <SidebarGroup className="mb-3">
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
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

      {/* Collapsible Incident Menu */}
      <SidebarGroup className="mb-3">
        <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
        <SidebarMenu>
          {/* Collapsible Environment Menu */}
          <Collapsible asChild>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton suppressHydrationWarning isActive={isEnvironmentActive}>
                  <Thermometer />
                  <span>Lingkungan</span>
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
                    : filteredEnvironmentAreas.map((area) => (
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
                              <span>{area.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* Collapsible Security Menu */}
          <Collapsible asChild>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton suppressHydrationWarning isActive={isSecurityActive}>
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
                              <span>{area.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          <Collapsible asChild>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton suppressHydrationWarning isActive={isIncidentActive}>
                  <AlertTriangle />
                  <span>Gangguan</span>
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
                    : filteredIncidentAreas.map((area) => (
                        <SidebarMenuSubItem key={area.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname ===
                              `/${area.warehouse_id}/${area.id}/gangguan`
                            }
                          >
                            <Link
                              href={`/${area.warehouse_id}/${area.id}/gangguan`}
                            >
                              <span>{area.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>

      {showManagement && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenu>
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

AppNavigationComponent.displayName = "AppNavigation";

export const AppNavigation = React.memo(AppNavigationComponent);

export function AppNavigationSkeleton({ userRole }: { userRole: string }) {
  return (
    <>
      {/* Platform Section */}
      <SidebarGroup className="mb-3">
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
        <SidebarMenu>
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
          {/* Incident Menu Skeleton */}
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
      {["admin", "super_admin"].includes(userRole) && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>
            <Skeleton className="h-4 w-24" />
          </SidebarGroupLabel>
          <SidebarMenu>
            {Array.from({ length: userRole === "super_admin" ? 4 : 3 }).map(
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
