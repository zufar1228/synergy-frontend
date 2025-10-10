// frontend/app/(main)/layout.tsx
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { jwtDecode } from "jwt-decode";
import { WarehouseProvider } from "@/contexts/WarehouseContext";
import { AppSidebar } from "@/components/app-sidebar";
import { getMyProfile, Profile } from "@/lib/api";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { cache } from "react";

// Cache user authentication data to avoid repeated calls
const getCachedUserData = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { user, session };
});

// Cache profile data with a shorter TTL for dynamic updates
const getCachedUserProfile = cache(async (token: string) => {
  try {
    const profile = await getMyProfile(token);
    return profile;
  } catch (error) {
    console.error("Gagal mengambil profil pengguna:", error);
    return { id: "", username: "Unknown" };
  }
});

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use cached user data instead of direct calls
  const { user, session } = await getCachedUserData();

  let userRole = "user";
  let userEmail = "";
  let userProfile: Profile = { id: "", username: "Guest" };
  let userAvatar: string | null = null;

  if (user && session) {
    // Decode JWT for role
    const jwt = jwtDecode(session.access_token) as { role: string };
    userRole = jwt.role || "user";
    userEmail = user.email || "";

    // Get avatar URL - try multiple fields and ensure HTTPS
    const avatarFromMeta =
      user.user_metadata?.picture ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.avatar ||
      null;

    if (avatarFromMeta) {
      // Ensure the URL uses HTTPS
      userAvatar = avatarFromMeta.startsWith("http://")
        ? avatarFromMeta.replace(/^http:/, "https:")
        : avatarFromMeta;
    }

    // Use cached profile data
    userProfile = await getCachedUserProfile(session.access_token);
  }

  const userData = {
    username: userProfile.username,
    email: userEmail,
    avatar: userAvatar,
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
            <main className="flex-1 overflow-y-auto p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </WarehouseProvider>
  );
}
