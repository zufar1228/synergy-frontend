// frontend/app/(main)/layout.tsx
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { jwtDecode } from "jwt-decode";
import { WarehouseProvider } from "@/contexts/WarehouseContext";
import { AppSidebar } from "@/components/app-sidebar";
import { getMyProfile, Profile } from "@/lib/api";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { redirect } from "next/navigation";
export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    {
      data: { session },
    },
  ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

  if (!user || !session) {
    redirect("/login");
  }

  let userRole = "user";
  let userEmail = "";

  if (user && session) {
    // Decode JWT for role
    const jwt = jwtDecode(session.access_token) as { role: string };
    userRole = jwt.role || "user";
    userEmail = user.email || "";
  }

  const userData = {
    email: userEmail,
    avatar:
      user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };

  return (
    <WarehouseProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-secondary">
          {/* Desktop Sidebar - hidden on mobile */}
          <div className="hidden lg:block">
            <AppSidebar userRole={userRole} user={userData} />
          </div>

          {/* Main Content Area */}
          <SidebarInset>
            {/* Mobile Header with Sidebar */}
            <SiteHeader userRole={userRole} user={userData} />
            <main className="flex-1 overflow-y-auto p-8 max-w-full">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </WarehouseProvider>
  );
}
