/**
 * @file users.ts
 * @purpose API functions for user management, profile, preferences, push notifications
 * @usedBy UserActions, profile components, hooks
 * @deps client (apiFetch)
 * @exports verifyUserAccess, getUsers, inviteUser, deleteUser, getMyProfile, updateMyProfile, updateUserRole, updateUserStatus + more
 * @sideEffects HTTP calls (GET/POST/PUT/DELETE)
 */

// frontend/lib/api/users.ts
import { apiFetch } from './client';
import { env } from '@/lib/env';
import type {
  User,
  Profile,
  VerifyAccessResponse,
  NotificationPreference
} from './types';

// --- Access Verification ---

export const verifyUserAccess = async (
  token: string
): Promise<VerifyAccessResponse> => {
  const res = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/api/users/verify-access`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.json();
};

// --- User Management ---

export const getUsers = (token: string): Promise<User[]> =>
  apiFetch('/users', token);

export const inviteUser = (
  data: { email: string; role: 'admin' | 'user' },
  token: string
): Promise<any> =>
  apiFetch('/users/invite', token, {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const deleteUser = (id: string, token: string): Promise<void> =>
  apiFetch(`/users/${id}`, token, { method: 'DELETE' });

// --- Profile ---

export const getMyProfile = (token: string): Promise<Profile> =>
  apiFetch('/users/me', token);

export const updateMyProfile = (
  data: { username: string },
  token: string
): Promise<Profile> =>
  apiFetch('/users/me', token, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// --- Role & Status ---

export const updateUserRole = (
  userId: string,
  role: 'admin' | 'user',
  token: string
): Promise<any> =>
  apiFetch(`/users/${userId}/role`, token, {
    method: 'PUT',
    body: JSON.stringify({ role })
  });

export const updateUserStatus = (
  userId: string,
  status: 'active' | 'inactive',
  token: string
): Promise<any> =>
  apiFetch(`/users/${userId}/status`, token, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });

// --- Preferences ---

export const getMyPreferences = (
  token: string
): Promise<NotificationPreference[]> =>
  apiFetch('/users/me/preferences', token);

export const updateMyPreferences = (
  data: NotificationPreference[],
  token: string
): Promise<NotificationPreference[]> =>
  apiFetch('/users/me/preferences', token, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// --- Push Notifications ---

export const getVapidPublicKey = (
  token: string
): Promise<{ publicKey: string }> => apiFetch('/users/push/vapid-key', token);

export const subscribeToPush = (
  token: string,
  subscription: PushSubscriptionJSON
): Promise<{ message: string }> =>
  apiFetch('/users/push/subscribe', token, {
    method: 'POST',
    body: JSON.stringify({ subscription })
  });

export const testPushNotification = (
  token: string
): Promise<{ message: string }> =>
  apiFetch('/users/push/test', token, { method: 'POST' });
