/**
 * @file warehouse-selector.tsx
 * @purpose Warehouse dropdown selector in sidebar
 * @usedBy AppSidebar
 * @deps useWarehouse, useWarehouses, Select UI
 * @exports WarehouseSelector
 * @sideEffects Updates WarehouseContext selection
 */

// frontend/components/warehouse-selector.tsx
"use client";

import * as React from "react";
import { ChevronsUpDown, Building2, Globe } from "lucide-react";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { useWarehouses } from "@/hooks/use-warehouses";
import type { Warehouse } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function WarehouseSelector() {
  const { selectedWarehouse, setSelectedWarehouse } = useWarehouse();
  const { isMobile } = useSidebar();
  const { warehouses } = useWarehouses();

  const currentWarehouse =
    selectedWarehouse === "all"
      ? { id: "all", name: "Semua Gudang" }
      : warehouses.find((w) => w.id === selectedWarehouse);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild suppressHydrationWarning>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-2 border-border hover:border hover:border-border"
              suppressHydrationWarning
            >
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {currentWarehouse?.id === "all" ? (
                  <Globe className="size-4" />
                ) : (
                  <Building2 className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentWarehouse?.name || "Memuat..."}
                </span>
                <span className="truncate text-xs">Tampilan Dashboard</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Pilih Gudang
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setSelectedWarehouse("all")}>
              <Globe className="size-4" />
              Semua Gudang
            </DropdownMenuItem>
            {warehouses.map((warehouse) => (
              <DropdownMenuItem
                key={warehouse.id}
                onSelect={() => setSelectedWarehouse(warehouse.id)}
              >
                <Building2 className="size-4" />
                {warehouse.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
