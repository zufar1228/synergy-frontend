// frontend/components/logout-button.tsx
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const LogoutButton = () => {
  return (
    <form action={logout}>
      <Button className="w-full justify-start">
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </form>
  );
};
