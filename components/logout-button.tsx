// frontend/components/logout-button.tsx
"use client";

import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useDemo } from "@/lib/demo/context";

export const LogoutButton = () => {
  const { isDemo, exitDemo } = useDemo();

  if (isDemo) {
    return (
      <Button className="w-full justify-start" onClick={exitDemo}>
        <LogOut className="mr-2 h-4 w-4" />
        Keluar Demo
      </Button>
    );
  }

  return (
    <form action={logout}>
      <Button className="w-full justify-start">
        <LogOut className="mr-2 h-4 w-4" />
        Keluar
      </Button>
    </form>
  );
};
