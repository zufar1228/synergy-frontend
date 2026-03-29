'use client';

import { useUserProfile } from './use-user-profile';

export function useUserRole() {
  const { profile, loading } = useUserProfile();
  const role = profile?.role || 'user';
  const isAdmin = role === 'admin' || role === 'super_admin';

  return { role, isAdmin, loading };
}
