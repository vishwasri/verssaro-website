const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const DEFAULT_SESSION_ID = 'demo-session-aw';

export function getClientSessionId(): string {
  if (typeof window === 'undefined') return DEFAULT_SESSION_ID;
  const saved = window.localStorage.getItem('verssaro_session_id');
  if (saved) return saved;
  window.localStorage.setItem('verssaro_session_id', DEFAULT_SESSION_ID);
  return DEFAULT_SESSION_ID;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('verssaro_jwt');
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem('verssaro_jwt', token);
  else window.localStorage.removeItem('verssaro_jwt');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('x-session-id', getClientSessionId());

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = `API request failed (${res.status})`;
    try {
      const payload = await res.json();
      if (Array.isArray(payload?.message)) {
        message = payload.message.join(', ');
      } else if (typeof payload?.message === 'string') {
        message = payload.message;
      }
    } catch {
      // ignore non-json error body
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export function getErrorMessage(
  err: unknown,
  fallback = 'REQUEST FAILED',
): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
