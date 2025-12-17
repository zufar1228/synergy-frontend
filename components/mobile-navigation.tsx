// frontend/components/mobile-navigation.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  Shield,
  ShieldAlert,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { createClient } from "@/lib/supabase/client";
import { getNavAreasBySystem, NavArea } from "@/lib/api";
import { toast } from "sonner";

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

export function MobileNavigation({
  userRole,
  onLinkClick,
}: {
  userRole: string;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const { selectedWarehouse } = useWarehouse();
  const [incidentAreas, setIncidentAreas] = useState<NavArea[]>([]);
  const [environmentAreas, setEnvironmentAreas] = useState<NavArea[]>([]);
  const [securityAreas, setSecurityAreas] = useState<NavArea[]>([]);
  const [intrusiAreas, setIntrusiAreas] = useState<NavArea[]>([]);
  const [proteksiAsetAreas, setProteksiAsetAreas] = useState<NavArea[]>([]);

  useEffect(() => {
    const fetchNavData = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      try {
        // Fetch data for all systems simultaneously
        const [incidentData, environmentData, securityData, intrusiData, proteksiAsetData] = await Promise.all(
          [
            getNavAreasBySystem("gangguan", session.access_token),
            getNavAreasBySystem("lingkungan", session.access_token),
            getNavAreasBySystem("keamanan", session.access_token),
            getNavAreasBySystem("intrusi", session.access_token),
            getNavAreasBySystem("proteksi_aset", session.access_token),
          ]
        );
        setIncidentAreas(incidentData);
        setEnvironmentAreas(environmentData);
        setSecurityAreas(securityData);
        setIntrusiAreas(intrusiData);
        setProteksiAsetAreas(proteksiAsetData);
      } catch (error) {
        toast.error("Gagal memuat navigasi.");
      }
    };
    fetchNavData();
  }, []);

  // Filter areas based on selected warehouse
  const filteredIncidentAreas = incidentAreas.filter(
    (area) =>
      selectedWarehouse === "all" || area.warehouse_id === selectedWarehouse
  );

  const filteredEnvironmentAreas = environmentAreas.filter(
    (area) =>
      selectedWarehouse === "all" || area.warehouse_id === selectedWarehouse
  );

  const filteredSecurityAreas = securityAreas.filter(
    (area) =>
      selectedWarehouse === "all" || area.warehouse_id === selectedWarehouse
  );

  const filteredIntrusiAreas = intrusiAreas.filter(
    (area) =>
      selectedWarehouse === "all" || area.warehouse_id === selectedWarehouse
  );

  const filteredProteksiAsetAreas = proteksiAsetAreas.filter(
    (area) =>
      selectedWarehouse === "all" || area.warehouse_id === selectedWarehouse
  );

  // Helper function to determine if a link is active
  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/profile") {
      return pathname === href;
    }
    // For management pages, check if path starts with href and is followed by / or end of string
    // This prevents false positives like /management matching /management-other
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Helper functions to determine if monitoring menus should be active
  const isEnvironmentActive = () => {
    return filteredEnvironmentAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/lingkungan`
    );
  };

  const isSecurityActive = () => {
    return filteredSecurityAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/keamanan`
    );
  };

  const isGangguanActive = () => {
    return filteredIncidentAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/gangguan`
    );
  };

  const isIntrusiActive = () => {
    return filteredIntrusiAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/intrusi`
    );
  };

  const isProteksiAsetActive = () => {
    return filteredProteksiAsetAreas.some(
      (area) => pathname === `/${area.warehouse_id}/${area.id}/proteksi_aset`
    );
  };

  return (
    <nav className="flex flex-col space-y-1 px-2">
      {/* Platform Links */}
      {mainLinks.map((link) => (
        <Link
          key={link.title}
          href={link.href}
          onClick={onLinkClick}
          className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
            isActive(link.href)
              ? "bg-main text-main-foreground"
              : "hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <link.icon className="h-5 w-5 flex-shrink-0" />
          <span>{link.title}</span>
        </Link>
      ))}

      {/* Monitoring Section */}
      <div className="text-sm font-semibold text-muted-foreground mt-4 px-2">
        Monitoring
      </div>

      {/* Collapsible Environment Menu */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              isEnvironmentActive()
                ? "bg-main text-main-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Thermometer className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">Lingkungan</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-5 pt-1 space-y-1">
          {filteredEnvironmentAreas.map((area) => (
            <Link
              key={area.id}
              href={`/${area.warehouse_id}/${area.id}/lingkungan`}
              onClick={onLinkClick}
              className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                pathname === `/${area.warehouse_id}/${area.id}/lingkungan`
                  ? "bg-main text-main-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <span>{area.name}</span>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible Security Menu */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              isSecurityActive()
                ? "bg-main text-main-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
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
                  ? "bg-main text-main-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <span>{area.name}</span>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible Incident Menu */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              isGangguanActive()
                ? "bg-main text-main-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">Gangguan</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-5 pt-1 space-y-1">
          {filteredIncidentAreas.map((area) => (
            <Link
              key={area.id}
              href={`/${area.warehouse_id}/${area.id}/gangguan`}
              onClick={onLinkClick}
              className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                pathname === `/${area.warehouse_id}/${area.id}/gangguan`
                  ? "bg-main text-main-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <span>{area.name}</span>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible Intrusi Menu */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              isIntrusiActive()
                ? "bg-main text-main-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Shield className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">Intrusi</span>
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
                  ? "bg-main text-main-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <span>{area.name}</span>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible Proteksi Aset Menu */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <div
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              isProteksiAsetActive()
                ? "bg-main text-main-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">Proteksi Aset</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-5 pt-1 space-y-1">
          {filteredProteksiAsetAreas.map((area) => (
            <Link
              key={area.id}
              href={`/${area.warehouse_id}/${area.id}/proteksi_aset`}
              onClick={onLinkClick}
              className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                pathname === `/${area.warehouse_id}/${area.id}/proteksi_aset`
                  ? "bg-main text-main-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <span>{area.name}</span>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Management Links */}
      {["admin", "super_admin"].includes(userRole) && (
        <>
          <div className="text-sm font-semibold text-muted-foreground mt-4 px-2">
            Management
          </div>
          {managementLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                isActive(link.href)
                  ? "bg-main text-main-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
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
