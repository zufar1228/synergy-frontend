// frontend/app/login/page.tsx
import { LoginForm } from '@/components/login-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FlickeringGrid } from '@/components/ui/shadcn-io/flickering-grid';

export default async function LoginPage({
  searchParams
}: {
  searchParams: { message: string };
}) {
  const { message } = await searchParams;

  // Check if user is already logged in
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  // If user has valid session, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6 md:p-10">
      <FlickeringGrid
        className="absolute inset-0 bg-secondary-background "
        squareSize={4}
        gridGap={6}
        flickerChance={0.3}
        maxOpacity={0.2}
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-4 sm:gap-6">
        {/* Branding (#5) */}
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-base overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-512x512.png"
              alt="Synergy IoT"
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-heading">Synergy IoT</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Sistem Monitoring IoT Gudang Anda
            </p>
          </div>
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
