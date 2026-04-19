/**
 * @file alerts.ts
 * @purpose API functions for active alerts and incident status updates
 * @usedBy Dashboard, system view components
 * @deps client (apiFetch)
 * @exports getActiveAlerts, updateIncidentStatus, updateKeamananLogStatus
 * @sideEffects HTTP calls (GET/PUT)
 */

// frontend/lib/api/alerts.ts
import { apiFetch } from './client';
import type { ActiveAlert, Incident, UpdateIncidentStatusPayload, KeamananLog } from './types';

export const getActiveAlerts = (
  warehouseId: string,
  token: string
): Promise<ActiveAlert[]> =>
  apiFetch(`/alerts/active?warehouse_id=${warehouseId}`, token, {
    cache: 'no-store',
  });

export const updateIncidentStatus = (
  incidentId: string,
  data: UpdateIncidentStatusPayload,
  token: string
): Promise<Incident> =>
  apiFetch(`/incidents/${incidentId}/status`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const updateKeamananLogStatus = (
  logId: string,
  data: UpdateIncidentStatusPayload,
  token: string
): Promise<KeamananLog> =>
  apiFetch(`/security-logs/${logId}/status`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
