// frontend/components/profile/PushNotificationManager.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api";

// Helper untuk konversi VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const PushNotificationManager = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports SW and Push
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      // Check if user is already subscribed
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Service Worker Error:", error);
    }
  };

  const subscribeUser = async () => {
    setLoading(true);
    try {
      // 1. Get VAPID key directly from Frontend Env
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error("VAPID Public Key tidak ditemukan di .env frontend");
      }

      const registration = await navigator.serviceWorker.ready;

      // 2. Request browser permission (Popup will appear here)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 3. Send subscription data to Backend to be saved
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("User tidak login");

      const res = await fetch(`${API_BASE_URL}/users/push/subscribe`, {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error("Gagal menyimpan subscription di server");

      setIsSubscribed(true);
      toast.success("Notifikasi perangkat ini diaktifkan!");
    } catch (error: any) {
      console.error(error);
      // Handle if user denies permission
      if (error.name === "NotAllowedError") {
        toast.error(
          "Izin notifikasi ditolak. Harap izinkan di pengaturan browser (ikon gembok di URL bar)."
        );
      } else {
        toast.error(`Gagal: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return null; // Don't render if browser doesn't support
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifikasi Perangkat (Push)</CardTitle>
        <CardDescription>
          Terima notifikasi langsung di perangkat ini saat ada insiden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <Button
            variant="neutral"
            className="w-full text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
            disabled
          >
            <Bell className="mr-2 h-4 w-4" /> Notifikasi Aktif di Perangkat Ini
          </Button>
        ) : (
          <Button onClick={subscribeUser} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BellOff className="mr-2 h-4 w-4" />
            )}
            {loading ? "Meminta Izin..." : "Aktifkan Notifikasi Push"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
