"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  password: z.string().min(8, { message: "Password minimal 8 karakter." }),
});

export default function SetupAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client only on client side
  const [supabase, setSupabase] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "" },
  });

  useEffect(() => {
    // Initialize Supabase client only after component mounts
    if (typeof window !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token") && hash.includes("refresh_token")) {
      setLoading(false);
    } else {
      const timer = setTimeout(() => {
        setError("Token undangan tidak valid atau sudah kedaluwarsa.");
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!supabase) {
      toast.error("Supabase client not initialized. Please refresh the page.");
      return;
    }

    // === PERBAIKAN UTAMA DI SINI ===
    // Ambil token dari URL hash secara manual
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      toast.error("Sesi tidak ditemukan di URL. Silakan coba lagi.");
      return;
    }

    // 1. Atur sesi secara eksplisit menggunakan token dari URL
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      toast.error(`Gagal mengatur sesi: ${sessionError.message}`);
      return;
    }

    // 2. Sekarang sesi sudah dijamin aktif, baru update pengguna
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success(
        "Password berhasil dibuat! Anda akan diarahkan ke dashboard."
      );
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Atur Akun Anda</CardTitle>
          <CardDescription>
            Buat password untuk menyelesaikan pendaftaran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Baru</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Menyimpan..."
                    : "Simpan dan Masuk"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
