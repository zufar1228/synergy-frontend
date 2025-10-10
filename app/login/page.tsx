// frontend/app/login/page.tsx
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FlickeringGrid } from "@/components/ui/shadcn-io/flickering-grid";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const { message } = await searchParams;

  // Check if user is already logged in
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user has valid session, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center gap-6 p-6 md:p-10">
      <FlickeringGrid
        className="absolute inset-0 bg-secondary-background "
        squareSize={4}
        gridGap={6}
        flickerChance={0.3}
        maxOpacity={0.2}
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          IoT Monitoring
        </div>
        <LoginForm />
        {message && (
          <p className="text-sm text-center p-2 bg-red-100 text-red-600 rounded-md">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
