// frontend/app/login/page.tsx
import { LoginForm } from '@/components/login-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { FlickeringGrid } from '@/components/ui/shadcn-io/flickering-grid';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';
import { DemoButton } from '@/components/demo-button';

export default async function LoginPage({
  searchParams
}: {
  searchParams: { message: string };
}) {
  const { message } = await searchParams;

  // Check if already in demo mode
  const cookieStore = await cookies();
  if (cookieStore.get('demo-mode')?.value === 'true') {
    redirect('/dashboard');
  }

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
      {/* Demo Button — top-left corner */}
      <div className="absolute top-4 left-4 z-20 sm:top-6 sm:left-6">
        <DemoButton />
      </div>

      <FlickeringGrid
        className="absolute inset-0 bg-secondary-background "
        squareSize={4}
        gridGap={6}
        flickerChance={0.3}
        maxOpacity={0.2}
      />
      <div className="relative z-10 flex w-full max-w-md flex-col gap-3 sm:gap-4">
        {/* Branding (#5) */}
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-base overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-512x512.png"
              alt="Synergy IoT"
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="text-center flex items-center justify-center w-full overflow-visible">
            <ContainerTextFlip
              words={['Synergy IoT', 'Sistem Monitoring IoT Gudang Anda']}
              interval={5000}
              className="text-base sm:text-lg md:text-xl font-heading font-bold px-4 py-2 border-2 border-border shadow-sm rounded-base bg-secondary [font-family:var(--font-space-grotesk)]"
              textClassName="font-heading font-bold [font-family:var(--font-space-grotesk)]"
            />
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
