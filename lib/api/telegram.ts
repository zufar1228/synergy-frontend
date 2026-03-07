// frontend/lib/api/telegram.ts
import { apiFetch } from './client';
import type {
  TelegramSubscriber,
  TelegramInviteResponse,
  TelegramMembersResponse,
} from './types';

export const getTelegramMembers = async (
  token: string,
  includeInactive = false
): Promise<TelegramSubscriber[]> => {
  const path = includeInactive
    ? '/telegram/members?include_inactive=true'
    : '/telegram/members';
  const json = await apiFetch<TelegramMembersResponse>(path, token, {
    cache: 'no-store',
  });
  return json.data;
};

export const generateTelegramInvite = (
  token: string
): Promise<TelegramInviteResponse> =>
  apiFetch('/telegram/invite', token, { method: 'POST' });

export const kickTelegramMember = (
  token: string,
  telegramUserId: string
): Promise<{ success: boolean; message: string }> =>
  apiFetch('/telegram/kick', token, {
    method: 'POST',
    body: JSON.stringify({ user_id: telegramUserId }),
  });

export const sendTelegramTestAlert = (
  token: string
): Promise<{ success: boolean; message: string }> =>
  apiFetch('/telegram/test-alert', token, { method: 'POST' });
