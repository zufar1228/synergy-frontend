// frontend/components/theme-toggle.tsx
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { ThemeSwitcher } from "@/components/ui/shadcn-io/theme-switcher";
import { Button } from "@/components/ui/button"; // Impor Button kustom Anda

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Tampilkan placeholder dengan ukuran yang sama untuk menghindari layout shift
    return <div className="h-9 w-[76px] rounded-base border-2 border-border" />;
  }

  const currentTheme =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";

  return (
    // Bungkus ThemeSwitcher dengan Button menggunakan asChild
    <Button variant="neutral" size="sm" asChild>
      <ThemeSwitcher
        value={currentTheme}
        onChange={(newTheme) =>
          setTheme(newTheme as "light" | "dark" | "system")
        }
      />
    </Button>
  );
}
