/**
 * @file client.ts
 * @purpose Centralized API fetch client with error handling and auth token injection
 * @usedBy All lib/api modules
 * @deps lib/env, lib/demo/api-interceptor
 * @exports API_BASE_URL, ApiError, buildApiError, apiFetch, apiFetchSafe
 * @sideEffects HTTP calls to backend API
 */

// frontend/lib/api/client.ts

import { env } from '@/lib/env';
import { getDemoResponse, isDemoMode } from '@/lib/demo/api-interceptor';

export const API_BASE_URL = env.NEXT_PUBLIC_API_URL + '/api';
export const DEFAULT_API_TIMEOUT_MS = 30_000;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 502, 503, 504]);

export type ApiErrorCode = 'HTTP' | 'NETWORK' | 'TIMEOUT' | 'ABORTED';
export type ApiError = Error & {
  status?: number;
  code?: ApiErrorCode;
  isRetryable?: boolean;
};

export type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
};

const normalizeTimeout = (timeoutMs?: number): number => {
  if (timeoutMs === undefined) return DEFAULT_API_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    return DEFAULT_API_TIMEOUT_MS;
  }
  return timeoutMs;
};

const createAbortSignalController = (
  timeoutMs: number,
  externalSignal?: AbortSignal
): {
  signal: AbortSignal;
  cleanup: () => void;
  didTimeout: () => boolean;
} => {
  const controller = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;

  const abortFrom = (reason: unknown) => {
    if (!controller.signal.aborted) {
      controller.abort(reason);
    }
  };

  const onExternalAbort = () => {
    abortFrom(externalSignal?.reason ?? 'aborted');
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      onExternalAbort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  if (timeoutMs > 0) {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      abortFrom('timeout');
    }, timeoutMs);
  }

  const cleanup = () => {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  };

  return {
    signal: controller.signal,
    cleanup,
    didTimeout: () => timedOut
  };
};

export const buildApiError = async (
  res: Response,
  fallbackMessage: string
): Promise<ApiError> => {
  const errorBody = await res
    .json()
    .catch(() => ({ message: fallbackMessage }));
  const message =
    typeof errorBody?.message === 'string' && errorBody.message.trim() !== ''
      ? errorBody.message
      : fallbackMessage;
  const apiError = new Error(message) as ApiError;
  apiError.status = res.status;
  apiError.code = 'HTTP';
  apiError.isRetryable = RETRYABLE_STATUS_CODES.has(res.status);
  return apiError;
};

/**
 * Shared fetch wrapper that handles auth headers and error handling.
 * Eliminates ~400 lines of repetitive boilerplate.
 */
export async function apiFetch<T>(
  path: string,
  token: string,
  options?: ApiFetchOptions
): Promise<T> {
  // --- Demo Mode Interception ---
  if (isDemoMode()) {
    const method = options?.method || 'GET';
    const mockData = getDemoResponse(path, method);
    if (mockData !== null) return mockData as T;
  }

  const headers = new Headers(options?.headers);
  headers.set('Authorization', `Bearer ${token}`);

  // Add Content-Type for requests with body
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const timeoutMs = normalizeTimeout(options?.timeoutMs);
  const { signal, cleanup, didTimeout } = createAbortSignalController(
    timeoutMs,
    options?.signal ?? undefined
  );

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal
    });
  } catch (error) {
    cleanup();

    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutReached = didTimeout();
      const abortError = new Error(
        timeoutReached
          ? `Request timed out after ${timeoutMs}ms`
          : 'Request was aborted'
      ) as ApiError;
      abortError.code = timeoutReached ? 'TIMEOUT' : 'ABORTED';
      abortError.isRetryable = timeoutReached;
      throw abortError;
    }

    const networkError = new Error(
      error instanceof Error ? error.message : 'Network request failed'
    ) as ApiError;
    networkError.code = 'NETWORK';
    networkError.isRetryable = true;
    throw networkError;
  }

  cleanup();

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      // Trigger global logout handle
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw await buildApiError(res, 'Request failed');
  }

  // Handle void responses (DELETE, etc.)
  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return undefined as T;
  }

  return res.json();
}

/**
 * Variant of apiFetch that returns null on error instead of throwing.
 * Useful for optional data fetches.
 */
export async function apiFetchSafe<T>(
  path: string,
  token: string,
  options?: ApiFetchOptions
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, token, options);
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error);
    return null;
  }
}
