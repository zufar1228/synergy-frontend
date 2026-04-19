/**
 * @file mobile-navigation.tsx
 * @purpose Bottom tab navigation for mobile viewport
 * @usedBy MainLayout (mobile only)
 * @deps useWarehouse, usePathname
 * @exports MobileNavigation
 * @sideEffects None
 */

// frontend/components/mobile-navigation.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
import { useWarehouse } from '@/contexts/WarehouseContext';
import { createClient } from '@/lib/supabase/client';
import { getNavAreasBySystem, NavArea } from '@/lib/api';
import { toast } from 'sonner';

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

export function MobileNavigation({
  userRole,
  onLinkClick
}: {
  userRole: string;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const { selectedWarehouse } = useWarehouse();
  const [securityAreas, setSecurityAreas] = useState<NavArea[]>([]);
  const [intrusiAreas, setIntrusiAreas] = useState<NavArea[]>([]);
  const [lingkunganAreas, setLingkunganAreas] = useState<NavArea[]>([]);

  useEffect(() => {
    const fetchNavData = async () => {
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;
      try {
        // Fetch data for all systems simultaneously
        const [securityData, intrusiData, lingkunganData] = await Promise.all([
          getNavAreasBySystem('keamanan', session.access_token),
          getNavAreasBySystem('intrusi', session.access_token),
          getNavAreasBySystem('lingkungan', session.access_token)
        ]);
        setSecurityAreas(securityData);
        setIntrusiAreas(intrusiData);
        setLingkunganAreas(lingkunganData);
      } catch (error) {
        toast.error('Gagal memuat navigasi.');
      }
    };
    fetchNavData();
  }, []);

  // Filter management links based on user role
  const filteredManagementLinks = managementLinks.filter((link) => {
    if (link.href === '/management/users') {
      return userRole === 'super_admin';
    }
    return true;
  });

  // Filter areas based on selected warehouse
  const filteredSecurityAreas = securityAreas.filter(
    (area) =>
      selectedWarehouse === 'all' || area.warehouse_id === selectedWarehouse
  );

  const filteredIntrusiAreas = intrusiAreas.filter(
    (area) =>
      selectedWarehouse === 'all' || area.warehouse_id === selectedWarehouse
  );

  const filteredLingkunganAreas = lingkunganAreas.filter(
    (area) =>
      selectedWarehouse === 'all' || area.warehouse_id === selectedWarehouse
  );

  // Helper function to determine if a link is active
  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/profile') {
      return pathname === href;
    }
    // For management pages, check if path starts with href and is followed by / or end of string
    // This prevents false positives like /management matching /management-other
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Helper functions to determine if monitoring menus should be active

  const isSecurityActive = () => {
    return filteredSecurityAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/keamanan`
    );
  };

  const isIntrusiActive = () => {
    return filteredIntrusiAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/intrusi`
    );
  };

  const isLingkunganActive = () => {
    return filteredLingkunganAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/lingkungan`
    );
  };

  return (
    <nav className="flex flex-col space-y-1 px-2">
      {/* Platform Section */}
      <div className="text-sm font-semibold text-muted-foreground px-2">
        Platform
      </div>
      {mainLinks.map((link) => (
        <Link
          key={link.title}
          href={link.href}
          onClick={onLinkClick}
          className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
            isActive(link.href)
              ? 'bg-main text-main-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <link.icon className="h-5 w-5 flex-shrink-0" />
          <span>{link.title}</span>
        </Link>
      ))}

      {/* Monitoring Section */}
      {(filteredSecurityAreas.length > 0 ||
        filteredIntrusiAreas.length > 0 ||
        filteredLingkunganAreas.length > 0) && (
        <>
          <div className="text-sm font-semibold text-muted-foreground mt-4 px-2">
            Monitoring
          </div>

          {/* Collapsible Security Menu */}
          {filteredSecurityAreas.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                    isSecurityActive()
                      ? 'bg-main text-main-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Camera className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">Keamanan</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-5 pt-1 space-y-1">
                {filteredSecurityAreas.map((area) => (
                  <Link
                    key={area.id}
                    href={`/${area.warehouse_id}/${area.id}/keamanan`}
                    onClick={onLinkClick}
                    className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                      pathname === `/${area.warehouse_id}/${area.id}/keamanan`
                        ? 'bg-main text-main-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {renderAreaName(area, selectedWarehouse)}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Collapsible Intrusi Menu */}
          {filteredIntrusiAreas.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                    isIntrusiActive()
                      ? 'bg-main text-main-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <DoorOpen className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">Intrusi Pintu</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-5 pt-1 space-y-1">
                {filteredIntrusiAreas.map((area) => (
                  <Link
                    key={area.id}
                    href={`/${area.warehouse_id}/${area.id}/intrusi`}
                    onClick={onLinkClick}
                    className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                      pathname === `/${area.warehouse_id}/${area.id}/intrusi`
                        ? 'bg-main text-main-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {renderAreaName(area, selectedWarehouse)}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Collapsible Lingkungan Menu */}
          {filteredLingkunganAreas.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                    isLingkunganActive()
                      ? 'bg-main text-main-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Thermometer className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">Lingkungan</span>
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-5 pt-1 space-y-1">
                {filteredLingkunganAreas.map((area) => (
                  <Link
                    key={area.id}
                    href={`/${area.warehouse_id}/${area.id}/lingkungan`}
                    onClick={onLinkClick}
                    className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                      pathname === `/${area.warehouse_id}/${area.id}/lingkungan`
                        ? 'bg-main text-main-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {renderAreaName(area, selectedWarehouse)}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}

      {/* Management Links */}
      {['admin', 'super_admin'].includes(userRole) && (
        <>
          <div className="text-sm font-semibold text-muted-foreground mt-4 px-2">
            Manajemen
          </div>
          {filteredManagementLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                isActive(link.href)
                  ? 'bg-main text-main-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              <span>{link.title}</span>
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
