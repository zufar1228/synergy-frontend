// frontend/components/app-sidebar.tsx
"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { WarehouseSelector } from "./warehouse-selector";
import { NavUser } from "./nav-user";
import { AppNavigation } from "./app-navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
  username?: string;
  email: string;
  avatar?: string | null;
}

const AppSidebarComponent = ({
  userRole,
  user,
}: {
  userRole: string;
  user: UserData;
}) => {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b-0">
        <WarehouseSelector />
      </SidebarHeader>
      <SidebarContent>
        <AppNavigation userRole={userRole} />
      </SidebarContent>
      <SidebarFooter className="border-t-0">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

AppSidebarComponent.displayName = "AppSidebar";

export const AppSidebar = React.memo(AppSidebarComponent);

const AppSidebarSkeletonComponent = ({ userRole }: { userRole: string }) => {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b-2">
        <div className="px-3 py-2">
          <Skeleton className="h-8 w-full" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Platform Section */}
        <div className="px-3 py-2 mb-3">
          <Skeleton className="h-4 w-16 mb-2" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>

        {/* Monitoring Section */}
        <div className="px-3 py-2 mb-3">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <div className="ml-4 space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-3/4" />
            ))}
          </div>
        </div>

        {/* Management Section - only for admin/super_admin */}
        {["admin", "super_admin"].includes(userRole) && (
          <div className="px-3 py-2">
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="space-y-2">
              {Array.from({ length: userRole === "super_admin" ? 4 : 3 }).map(
                (_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                )
              )}
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 py-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

AppSidebarSkeletonComponent.displayName = "AppSidebarSkeleton";

export const AppSidebarSkeleton = React.memo(AppSidebarSkeletonComponent);
