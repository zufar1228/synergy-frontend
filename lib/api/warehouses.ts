/**
 * @file warehouses.ts
 * @purpose API functions for warehouse CRUD and detail retrieval
 * @usedBy WarehouseActions, dashboard, useWarehouses hook
 * @deps client (apiFetch)
 * @exports getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, getWarehouseDetails
 * @sideEffects HTTP calls (GET/POST/PUT/DELETE)
 */

// frontend/lib/api/warehouses.ts
import { apiFetch } from './client';
import type { Warehouse, WarehouseDetails } from './types';

export const getWarehouses = (token: string): Promise<Warehouse[]> =>
  apiFetch('/warehouses', token);

export const createWarehouse = (
  data: { name: string; location?: string },
  token: string
): Promise<Warehouse> =>
  apiFetch('/warehouses', token, {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateWarehouse = (
  id: string,
  data: { name: string; location?: string },
  token: string
): Promise<Warehouse> =>
  apiFetch(`/warehouses/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const deleteWarehouse = (id: string, token: string): Promise<void> =>
  apiFetch(`/warehouses/${id}`, token, { method: 'DELETE' });

export const getWarehouseDetails = (
  id: string,
  token: string
): Promise<WarehouseDetails> =>
  apiFetch(`/warehouses/${id}/areas-with-systems`, token, {
    timeoutMs: 20_000,
    cache: 'no-store'
  });
