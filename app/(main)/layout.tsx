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

  let userRole = "user";
  let userEmail = "";
  let userProfile: Profile = { id: "", username: "" };
  let userAvatar: string | null = null;

  if (user && session) {
    // Decode JWT for role
    const jwt = jwtDecode(session.access_token) as { role: string };
    userRole = jwt.role || "user";
    userEmail = user.email || "";

    // Establish a meaningful default username from Supabase metadata in case API lookup fails
    const metadataUsername =
      (typeof user.user_metadata?.username === "string"
        ? user.user_metadata?.username
        : undefined) ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata?.full_name
        : undefined) ||
      user.email?.split("@")[0] ||
      "User";
    userProfile = { id: user.id, username: metadataUsername };

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

    try {
      const profileFromApi = await getMyProfile(session.access_token);
      if (profileFromApi && profileFromApi.username) {
        userProfile = profileFromApi;
      } else {
        console.warn(
          "Profile API returned without username, using metadata fallback."
        );
      }
    } catch (error) {
      console.error("Gagal mengambil profil pengguna:", error);
      const status =
        typeof error === "object" && error && "status" in error
          ? (error as { status?: number }).status
          : undefined;
      if (status === 401 || status === 403) {
        await supabase.auth.signOut();
        redirect("/login");
      }
    }
  }

  const userData = {
    username: userProfile.username || userEmail,
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
