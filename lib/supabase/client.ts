/**
 * @file client.ts
 * @purpose Browser-side Supabase client factory
 * @usedBy Client components needing Supabase (auth, realtime)
 * @deps @supabase/ssr, lib/env
 * @exports createClient
 * @sideEffects None
 */

// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
}
