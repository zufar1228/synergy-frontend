/**
 * @file devices.ts
 * @purpose API functions for device CRUD and area device details
 * @usedBy DeviceActions, management page, DeviceStatusContext
 * @deps client (apiFetch)
 * @exports getDevices, createDevice, updateDevice, deleteDevice, getDeviceDetailsByArea
 * @sideEffects HTTP calls (GET/POST/PUT/DELETE)
 */

// frontend/lib/api/devices.ts
import { apiFetch } from './client';
import type { Device, CreateDeviceResponse, EnvironmentDeviceStatus } from './types';

export const getDevices = (token: string): Promise<Device[]> =>
  apiFetch('/devices', token);

export const createDevice = (
  data: { name: string; area_id: string; system_type: string },
  token: string
): Promise<CreateDeviceResponse> =>
  apiFetch('/devices', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateDevice = (
  id: string,
  data: { name: string; area_id: string; system_type?: string },
  token: string
): Promise<Device> =>
  apiFetch(`/devices/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteDevice = (id: string, token: string): Promise<void> =>
  apiFetch(`/devices/${id}`, token, { method: 'DELETE' });

export const getDeviceDetailsByArea = (
  token: string,
  areaId: string,
  systemType: string
): Promise<EnvironmentDeviceStatus> =>
  apiFetch(
    `/devices/details?area_id=${areaId}&system_type=${systemType}`,
    token,
    { cache: 'no-store' }
  );
