// frontend/components/nav-user.tsx
"use client";

import { ChevronsUpDown, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/app/login/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

import { UserProfileDisplay } from "@/components/user-profile-display";

interface NavUserProps {
  user: {
    email: string;
    avatar?: string | null;
  };
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    // Reset states when avatar changes
    setImageError(false);
    setImageLoading(true);

    if (user.avatar) {
      // Check if this is the problematic Google avatar URL
      const isProblematicGoogleAvatar =
        user.avatar.includes("lh3.googleusercontent.com") &&
        user.avatar.includes(
          "ACg8ocKzWc32AfRX6xfFXUSJfIPtiJ9nodixED5-eo7GwKmkC6wsns1I"
        );

      if (isProblematicGoogleAvatar) {
        // Force fallback for this specific problematic avatar
        console.log("Detected problematic Google avatar, using fallback");
        setImageError(true);
        setImageLoading(false);
        return;
      }

      // Pre-load image to check if it's accessible
      const img = new Image();
      const timeout = setTimeout(() => {
        // If image doesn't load within 5 seconds, assume it's failed
        setImageLoading(false);
        setImageError(true);
        console.log("Avatar image load timeout:", user.avatar);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        setImageLoading(false);
        setImageError(false);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        setImageLoading(false);
        setImageError(true);
        console.log("Avatar image failed to load:", user.avatar);
      };
      img.src = user.avatar;
    } else {
      setImageLoading(false);
    }
  }, [user.avatar]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-2 border-border hover:border hover:border-border"
              suppressHydrationWarning
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.avatar && !imageError && !imageLoading ? (
                  <AvatarImage
                    src={user.avatar}
                    alt="User"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : null}
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {imageLoading && user.avatar ? "..." : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  <UserProfileDisplay fallbackName="Loading..." />
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar && !imageError && !imageLoading ? (
                    <AvatarImage
                      src={user.avatar}
                      alt="User"
                      onError={() => setImageError(true)}
                      onLoad={() => setImageError(false)}
                    />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {imageLoading && user.avatar ? "..." : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    <UserProfileDisplay fallbackName="Loading..." />
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => router.push("/profile")}>
                <User />
                Profil
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logout} className="w-full">
                <button
                  type="submit"
                  className="w-full text-left flex items-center gap-2"
                >
                  <LogOut />
                  <span>Log out</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
