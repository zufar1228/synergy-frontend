'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getNavAreasBySystem,
  NavArea,
  getDeviceDetailsByArea
} from '@/lib/api';

const systemTypeLabels: Record<string, string> = {
  keamanan: 'Keamanan',
  intrusi: 'Keamanan Pintu'
};

const staticRoutes: Record<string, string> = {
  dashboard: 'Dashboard',
  profile: 'Profil',
  management: 'Manajemen'
};

const managementSubRoutes: Record<string, string> = {
  warehouses: 'Gudang',
  areas: 'Area',
  devices: 'Perangkat',
  users: 'Pengguna'
};

export function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const [navAreas, setNavAreas] = useState<NavArea[]>([]);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  // Fetch nav areas in one shot (all systems) for name resolution
  useEffect(() => {
    const fetchAreas = async () => {
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const [sec, intr] = await Promise.all([
          getNavAreasBySystem('keamanan', session.access_token),
          getNavAreasBySystem('intrusi', session.access_token)
        ]);
        setNavAreas([...sec, ...intr]);
      } catch {
        // Silently fail — breadcrumbs will show IDs as fallback
      }
    };
    fetchAreas();
  }, []);

  // fetch device name when pathname changes
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 3) {
      const [, areaId, systemType] = segments;
      (async () => {
        try {
          const supabase = createClient();
          const {
            data: { session }
          } = await supabase.auth.getSession();
          if (session) {
            const dev = await getDeviceDetailsByArea(
              session.access_token,
              areaId,
              systemType
            );
            if (dev) setDeviceName(dev.name);
          }
        } catch {}
      })();
    } else {
      setDeviceName(null);
    }
  }, [pathname]);

  const crumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    const result: { label: string; href: string; isLast: boolean }[] = [];

    // Route: /dashboard
    if (segments[0] === 'dashboard') {
      return [{ label: 'Dashboard', href: '/dashboard', isLast: true }];
    }

    // Route: /profile
    if (segments[0] === 'profile') {
      return [{ label: 'Profil', href: '/profile', isLast: true }];
    }

    // Route: /management/...
    if (segments[0] === 'management') {
      result.push({
        label: 'Manajemen',
        href: '/management/warehouses',
        isLast: segments.length === 1
      });
      if (segments[1]) {
        const subLabel = managementSubRoutes[segments[1]] || segments[1];
        result.push({
          label: subLabel,
          href: `/management/${segments[1]}`,
          isLast: true
        });
      }
      return result;
    }

    // Route: /[warehouseId]/[areaId]/[systemType]
    // Resolve names from navAreas
    if (segments.length >= 3) {
      const [warehouseId, areaId, systemType] = segments;

      // Find area info for name resolution
      const area = navAreas.find(
        (a) => a.id === areaId && a.warehouse_id === warehouseId
      );

      const warehouseName = area?.warehouse_name || 'Gudang';
      const areaName = area?.name || 'Area';
      const systemLabel = systemTypeLabels[systemType] || systemType;

      result.push({
        label: warehouseName,
        href: `/dashboard`,
        isLast: false
      });
      result.push({
        label: areaName,
        href: `/${warehouseId}/${areaId}/${systemType}`,
        isLast: false
      });
      // last crumb will be replaced with device name if we have it
      result.push({
        label: deviceName || systemLabel,
        href: `/${warehouseId}/${areaId}/${systemType}`,
        isLast: true
      });
      return result;
    }

    // Fallback: static route labels
    if (staticRoutes[segments[0]]) {
      return [
        {
          label: staticRoutes[segments[0]],
          href: `/${segments[0]}`,
          isLast: true
        }
      ];
    }

    return [];
  }, [pathname, navAreas, deviceName]);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={`${crumb.href}-${i}`}>
            {i > 0 && <BreadcrumbSeparator className="hidden sm:flex" />}
            <BreadcrumbItem
              className={
                crumbs.length > 1 && i < crumbs.length - 1
                  ? 'hidden sm:flex items-center'
                  : 'flex items-center'
              }
            >
              {crumb.isLast ? (
                <BreadcrumbPage className="truncate max-w-[120px] sm:max-w-none">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={crumb.href}
                    className="truncate max-w-[100px] sm:max-w-none"
                  >
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
