/**
 * @file api-interceptor.ts
 * @purpose Intercepts API calls in demo mode and returns mock data
 * @usedBy lib/api/client (apiFetch)
 * @deps mock-data
 * @exports getDemoResponse, isDemoMode
 * @sideEffects Reads demo cookie
 */

// frontend/lib/demo/api-interceptor.ts
// Maps API paths to mock data for demo mode.

import {
  DEMO_WAREHOUSES,
  DEMO_AREAS,
  DEMO_DEVICES,
  DEMO_WAREHOUSE_DETAILS,
  DEMO_ACTIVE_ALERTS,
  DEMO_PROFILE,
  DEMO_USERS,
  DEMO_PREFERENCES,
  DEMO_TELEGRAM_MEMBERS,
  DEMO_NAV_AREAS,
  DEMO_LINGKUNGAN_STATUS,
  DEMO_LINGKUNGAN_CHART,
  DEMO_LINGKUNGAN_LOGS,
  DEMO_INTRUSI_STATUS,
  DEMO_INTRUSI_LOGS,
  DEMO_INTRUSI_SUMMARY,
  DEMO_KEAMANAN_LOGS,
  DEMO_DEVICE_DETAILS,
  DEMO_VERIFY_ACCESS,
  DEMO_VAPID,
  getDemoAnalytics,
} from './mock-data';

/**
 * Returns mock data for a given API path, or null if no match is found.
 * Simulates a small async delay to mimic network latency.
 */
export function getDemoResponse(path: string, method: string = 'GET'): any | null {
  // Normalize: remove query string for matching, but keep it accessible
  const [pathOnly, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');

  // --- POST/PUT/DELETE → return success responses ---
  if (method !== 'GET') {
    // Control commands
    if (pathOnly.match(/\/lingkungan\/devices\/[^/]+\/control/)) {
      return { message: 'Perintah kontrol berhasil dikirim (demo)' };
    }
    if (pathOnly.match(/\/intrusi\/devices\/[^/]+\/command/)) {
      return { message: 'Perintah berhasil dikirim (demo)', device_id: 'demo', command: 'demo' };
    }
    // Log status updates
    if (pathOnly.match(/\/(intrusi|lingkungan)\/logs\/[^/]+\/status/)) {
      return { id: 'demo-log', status: 'acknowledged', notes: 'Demo update' };
    }
    if (pathOnly.match(/\/security-logs\/[^/]+\/status/)) {
      return { id: 'demo-log', status: 'acknowledged', notes: 'Demo update' };
    }
    if (pathOnly.match(/\/incidents\/[^/]+\/status/)) {
      return { id: 'demo-log', status: 'acknowledged', notes: 'Demo update' };
    }
    // User management
    if (pathOnly.match(/\/users\/invite/)) {
      return { message: 'Undangan berhasil dikirim (demo)' };
    }
    if (pathOnly.match(/\/users\/[^/]+\/role/)) {
      return { message: 'Role berhasil diupdate (demo)' };
    }
    if (pathOnly.match(/\/users\/[^/]+\/status/)) {
      return { message: 'Status berhasil diupdate (demo)' };
    }
    // Profile update
    if (pathOnly === '/users/me') {
      return DEMO_PROFILE;
    }
    if (pathOnly === '/users/me/preferences') {
      return DEMO_PREFERENCES;
    }
    // Telegram
    if (pathOnly === '/telegram/invite') {
      return { success: true, invite_link: 'https://t.me/demo_invite', expires_at: new Date(Date.now() + 86400000).toISOString(), member_limit: 1 };
    }
    if (pathOnly === '/telegram/kick') {
      return { success: true, message: 'Member berhasil dikeluarkan (demo)' };
    }
    if (pathOnly === '/telegram/test-alert') {
      return { success: true, message: 'Test alert berhasil dikirim (demo)' };
    }
    // Push
    if (pathOnly === '/users/push/subscribe') {
      return { message: 'Subscribed (demo)' };
    }
    if (pathOnly === '/users/push/test') {
      return { message: 'Push notification sent (demo)' };
    }
    // Warehouse/area/device CRUD
    if (pathOnly === '/warehouses') {
      return DEMO_WAREHOUSES[0];
    }
    if (pathOnly === '/areas') {
      return DEMO_AREAS[0];
    }
    if (pathOnly === '/devices') {
      return { device: DEMO_DEVICES[0], mqttCredentials: null };
    }
    // Generic success for unhandled mutations
    return { message: 'Berhasil (demo)' };
  }

  // --- GET routes ---

  // Warehouses
  if (pathOnly === '/warehouses') {
    return DEMO_WAREHOUSES;
  }
  if (pathOnly.match(/^\/warehouses\/[^/]+\/areas-with-systems$/)) {
    const id = pathOnly.split('/')[2];
    return DEMO_WAREHOUSE_DETAILS[id] || DEMO_WAREHOUSE_DETAILS['demo-wh-001'];
  }

  // Alerts
  if (pathOnly === '/alerts/active') {
    return DEMO_ACTIVE_ALERTS;
  }

  // Users
  if (pathOnly === '/users/me') {
    return DEMO_PROFILE;
  }
  if (pathOnly === '/users/me/preferences') {
    return DEMO_PREFERENCES;
  }
  if (pathOnly === '/users') {
    return DEMO_USERS;
  }
  if (pathOnly === '/users/push/vapid-key') {
    return DEMO_VAPID;
  }
  if (pathOnly.match(/^\/api\/users\/verify-access/) || pathOnly === '/users/verify-access') {
    return DEMO_VERIFY_ACCESS;
  }

  // Areas
  if (pathOnly === '/areas') {
    const warehouseId = params.get('warehouse_id');
    if (warehouseId) return DEMO_AREAS.filter((a) => a.warehouse_id === warehouseId);
    return DEMO_AREAS;
  }

  // Devices
  if (pathOnly === '/devices') {
    return DEMO_DEVICES;
  }
  if (pathOnly === '/devices/details') {
    const areaId = params.get('area_id');
    const systemType = params.get('system_type');
    if (areaId && systemType) {
      return DEMO_DEVICE_DETAILS[`${areaId}-${systemType}`] || null;
    }
    return DEMO_DEVICES[0];
  }

  // Navigation
  if (pathOnly === '/navigation/areas-by-system') {
    const systemType = params.get('system_type') as 'keamanan' | 'intrusi' | 'lingkungan';
    return DEMO_NAV_AREAS[systemType] || [];
  }

  // Telegram
  if (pathOnly === '/telegram/members') {
    return DEMO_TELEGRAM_MEMBERS;
  }

  // Analytics
  if (pathOnly.match(/^\/analytics\//)) {
    const systemType = pathOnly.split('/')[2];
    const areaId = params.get('area_id') || '';
    return getDemoAnalytics(systemType, areaId);
  }

  // --- Lingkungan ---
  if (pathOnly.match(/^\/lingkungan\/devices\/[^/]+\/status$/)) {
    return { data: DEMO_LINGKUNGAN_STATUS };
  }
  if (pathOnly.match(/^\/lingkungan\/devices\/[^/]+\/chart$/)) {
    return DEMO_LINGKUNGAN_CHART;
  }

  // --- Intrusi ---
  if (pathOnly.match(/^\/intrusi\/devices\/[^/]+\/status$/)) {
    return DEMO_INTRUSI_STATUS;
  }
  if (pathOnly.match(/^\/intrusi\/devices\/[^/]+\/logs$/)) {
    return {
      data: DEMO_INTRUSI_LOGS,
      pagination: { total: DEMO_INTRUSI_LOGS.length, limit: 25, offset: 0, hasMore: false },
    };
  }
  if (pathOnly.match(/^\/intrusi\/devices\/[^/]+\/summary$/)) {
    return DEMO_INTRUSI_SUMMARY;
  }

  // Fallback — no match
  console.warn(`[Demo Mode] No mock data for: ${method} ${path}`);
  return null;
}

/**
 * Check if the demo-mode cookie is set (client-side only).
 */
export function isDemoMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('demo-mode='));
}
