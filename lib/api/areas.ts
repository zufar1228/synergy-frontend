/**
 * @file areas.ts
 * @purpose API functions for area CRUD operations
 * @usedBy AreaActions, management page
 * @deps client (apiFetch)
 * @exports getAreas, createArea, updateArea, deleteArea, getAreasByWarehouse
 * @sideEffects HTTP calls (GET/POST/PUT/DELETE)
 */

// frontend/lib/api/areas.ts
import { apiFetch } from './client';
import type { Area } from './types';

export const getAreas = (token: string): Promise<Area[]> =>
  apiFetch('/areas', token);

export const createArea = (
  data: { name: string; warehouse_id: string },
  token: string
): Promise<Area> =>
  apiFetch('/areas', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateArea = (
  id: string,
  data: { name: string; warehouse_id: string },
  token: string
): Promise<Area> =>
  apiFetch(`/areas/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteArea = (id: string, token: string): Promise<void> =>
  apiFetch(`/areas/${id}`, token, { method: 'DELETE' });

export const getAreasByWarehouse = (
  warehouseId: string,
  token: string
): Promise<Area[]> =>
  apiFetch(`/areas?warehouse_id=${warehouseId}`, token);
