// frontend/components/warehouse-selector.tsx
"use client";

import * as React from "react";
import { ChevronsUpDown, Building2, Globe } from "lucide-react";
import { useWarehouse } from "@/contexts/WarehouseContext";
import { getWarehouses, Warehouse } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
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
import { toast } from "sonner";

export function WarehouseSelector() {
  const { selectedWarehouse, setSelectedWarehouse } = useWarehouse();
  const { isMobile } = useSidebar();
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);

  React.useEffect(() => {
    const fetchWarehouses = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const data = await getWarehouses(session.access_token);
        setWarehouses(data);
      } catch {
        toast.error("Gagal memuat daftar gudang.");
      }
    };
    fetchWarehouses();
  }, []);

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
