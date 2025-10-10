// frontend/components/mobile-sidebar.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { WarehouseSelector } from "./warehouse-selector";
import { NavUser } from "./nav-user";
import { MobileNavigation } from "./mobile-navigation";

interface UserData {
  username: string;
  email: string;
  avatar: string | null;
}

export const MobileSidebar = ({
  user,
  userRole,
}: {
  user: UserData;
  userRole: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild suppressHydrationWarning>
        <Button variant="default" size="icon" suppressHydrationWarning>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 flex flex-col w-72"
        suppressHydrationWarning
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <div className="p-2">
          <WarehouseSelector />
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          {/* Kirim onLinkClick untuk menutup sheet saat link diklik */}
          <MobileNavigation
            userRole={userRole}
            onLinkClick={() => setOpen(false)}
          />
        </div>
        <div className="p-2 border-t border-sidebar-border">
          <NavUser user={user} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
