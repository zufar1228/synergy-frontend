/**
 * @file page.tsx
 * @purpose Root landing page — redirects authenticated users to dashboard
 * @usedBy Next.js app router (/)
 * @deps supabase/server
 * @exports Home (default)
 * @sideEffects Server-side auth check, redirect
 */

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
