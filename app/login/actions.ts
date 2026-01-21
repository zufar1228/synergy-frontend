// frontend/app/login/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyUserAccess } from "@/lib/api";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const { data: sessionData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // TAMBAHKAN INI UNTUK MELIHAT ERROR ASLI DI TERMINAL NEXT.JS
    console.error("Supabase Login Error:", error.message);

    // Kita bisa membuat pesan redirect lebih spesifik
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  // Verify if user is authorized (was invited or manually added)
  if (sessionData?.session) {
    try {
      const accessResult = await verifyUserAccess(sessionData.session.access_token);
      
      if (!accessResult.authorized) {
        // User not authorized - sign them out and redirect to login with error
        await supabase.auth.signOut();
        return redirect(`/login?message=${encodeURIComponent(accessResult.message)}`);
      }
    } catch (verifyError) {
      console.error("Error verifying user access:", verifyError);
      // On error, sign out to be safe and redirect with error
      await supabase.auth.signOut();
      return redirect(`/login?message=Gagal memverifikasi akses. Silakan coba lagi.`);
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
export async function logout() {
  const supabase = await createClient();

  // Sign out from Supabase (this clears all auth cookies)
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error.message);
  }

  // Revalidate all cached paths to ensure fresh data on next visit
  revalidatePath("/", "layout");

  // Redirect to login page
  redirect("/login");
}

// ... (fungsi signup)
