export const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); this.name = 'ApiError'; }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes((init.method || 'GET').toUpperCase())) {
    const csrf = document.cookie.split('; ').find((part) => part.startsWith('flowdesk_csrf='))?.split('=').slice(1).join('=');
    if (csrf) headers.set('X-CSRF-Token', decodeURIComponent(csrf));
  }
  const response = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, { ...init, headers, credentials: 'include' });
  const payload = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) throw new ApiError(payload?.message || `Request failed (${response.status})`, response.status, payload?.code);
  return payload as T;
}
