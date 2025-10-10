// frontend/components/sidebar/warehouse-switcher.tsx
"use client";

import * as React from "react";
import { ChevronsUpDown, Globe, Building2 } from "lucide-react";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { getWarehouses, Warehouse } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
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

export function WarehouseSwitcher() {
  const { isMobile } = useSidebar();
  const { selectedWarehouse, setSelectedWarehouse } = useWarehouse();
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);

  React.useEffect(() => {
    // ... (Logika fetchWarehouses sama seperti sebelumnya)
  }, []);

  const currentWarehouse =
    selectedWarehouse === "all"
      ? { id: "all", name: "Semua Gudang" }
      : warehouses.find((w) => w.id === selectedWarehouse);

  const Icon = currentWarehouse?.id === "all" ? Globe : Building2;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-accent"
            >
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentWarehouse?.name || "Memuat..."}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Dashboard
                </span>
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
            <DropdownMenuLabel>Pilih Gudang</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => setSelectedWarehouse("all")}
              className="gap-2 p-2"
            >
              <Globe className="size-4" /> Semua Gudang
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {warehouses.map((warehouse) => (
              <DropdownMenuItem
                key={warehouse.id}
                onSelect={() => setSelectedWarehouse(warehouse.id)}
                className="gap-2 p-2"
              >
                <Building2 className="size-4" /> {warehouse.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
