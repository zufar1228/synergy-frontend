// frontend/app/login/demo-action.ts
'use server';

import { cookies } from 'next/headers';

export async function startDemo() {
  const cookieStore = await cookies();
  cookieStore.set('demo-mode', 'true', {
    path: '/',
    maxAge: 3600, // 1 hour
    sameSite: 'lax',
    httpOnly: false, // Needs to be readable from client-side JS
  });
  // Return success — client handles redirect
  return { success: true };
}
