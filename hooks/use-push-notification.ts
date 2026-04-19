/**
 * @file use-push-notification.ts
 * @purpose Hook for Web Push subscription management
 * @usedBy PushNotificationManager
 * @deps useApiQuery, useApiMutation, lib/api/users
 * @exports usePushNotification
 * @sideEffects Browser push permission request, API calls
 */

// frontend/hooks/use-push-notification.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getVapidPublicKey,
  subscribeToPush,
  testPushNotification
} from '@/lib/api';

type PermissionState = NotificationPermission | 'unsupported';

/**
 * Convert a base64-encoded string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotification() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial state
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);

    // Check if already subscribed
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker?.ready;
        if (!registration) return;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        // Silently fail
      }
    };
    checkSubscription();
  }, []);

  /** Request permission and subscribe to push notifications */
  const subscribe = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Push notifications not supported' };
    }

    setIsLoading(true);
    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        return { success: false, error: 'Notification permission denied' };
      }

      // 2. Get token
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      // 3. Get VAPID key from backend
      const { publicKey } = await getVapidPublicKey(session.access_token);

      // 4. Subscribe via push manager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // 5. Send subscription to backend
      await subscribeToPush(session.access_token, subscription.toJSON());

      setIsSubscribed(true);
      return { success: true };
    } catch (err: any) {
      console.error('[Push] Subscribe failed:', err);
      return { success: false, error: err.message || 'Failed to subscribe' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Unsubscribe from push notifications */
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (!registration) return { success: false, error: 'No SW registration' };

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return { success: true };
    } catch (err: any) {
      console.error('[Push] Unsubscribe failed:', err);
      return { success: false, error: err.message || 'Failed to unsubscribe' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Send a test push notification to yourself */
  const sendTest = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }
      await testPushNotification(session.access_token);
      return { success: true };
    } catch (err: any) {
      console.error('[Push] Test notification failed:', err);
      return { success: false, error: err.message || 'Failed to send test' };
    }
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported: permission !== 'unsupported',
    subscribe,
    unsubscribe,
    sendTest
  };
}
