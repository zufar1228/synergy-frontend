// frontend/lib/api/client.ts

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

export type ApiError = Error & { status?: number };

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
  return apiError;
};

/**
 * Shared fetch wrapper that handles auth headers and error handling.
 * Eliminates ~400 lines of repetitive boilerplate.
 */
export async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  // Add Content-Type for requests with body
  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

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
  options?: RequestInit
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, token, options);
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error);
    return null;
  }
}
