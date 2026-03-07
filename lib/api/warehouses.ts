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
    body: JSON.stringify(data),
  });

export const updateWarehouse = (
  id: string,
  data: { name: string; location?: string },
  token: string
): Promise<Warehouse> =>
  apiFetch(`/warehouses/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteWarehouse = (id: string, token: string): Promise<void> =>
  apiFetch(`/warehouses/${id}`, token, { method: 'DELETE' });

export const getWarehouseDetails = (
  id: string,
  token: string
): Promise<WarehouseDetails> =>
  apiFetch(`/warehouses/${id}/areas-with-systems`, token, {
    cache: 'no-store',
  });
