/**
 * @file navigation.ts
 * @purpose API function to fetch areas grouped by system type for navigation
 * @usedBy useNavAreas hook
 * @deps client (apiFetch)
 * @exports getNavAreasBySystem
 * @sideEffects HTTP call (GET)
 */

// frontend/lib/api/navigation.ts
import { apiFetch } from './client';
import type { NavArea } from './types';

export const getNavAreasBySystem = (
  systemType: string,
  token: string
): Promise<NavArea[]> =>
  apiFetch(
    `/navigation/areas-by-system?system_type=${systemType}`,
    token
  );
