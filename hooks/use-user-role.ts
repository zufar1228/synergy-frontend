/**
 * @file use-user-role.ts
 * @purpose Hook to fetch current user role for RBAC
 * @usedBy Components needing role-based rendering
 * @deps useApiQuery, supabase/client
 * @exports useUserRole
 * @sideEffects API call (verifyAccess)
 */

'use client';

import { useUserProfile } from './use-user-profile';

export function useUserRole() {
  const { profile, loading } = useUserProfile();
  const role = profile?.role || 'user';
  const isAdmin = role === 'admin' || role === 'super_admin';

  return { role, isAdmin, loading };
}
