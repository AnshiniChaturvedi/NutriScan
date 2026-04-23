import type {
  AuthSession,
  AuthUser,
  LoginRequest,
  SearchHistoryCreate,
  SearchHistoryItem,
  SignupRequest,
} from './types';

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'detail' in payload
        ? String((payload as { detail?: unknown }).detail || 'Request failed.')
        : typeof payload === 'object' && payload && 'error' in payload
          ? String((payload as { error?: unknown }).error || 'Request failed.')
          : 'Request failed.';
    throw new Error(message);
  }

  return payload as T;
}

export async function signIn(payload: LoginRequest): Promise<AuthSession> {
  return requestJson<AuthSession>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signUp(payload: SignupRequest): Promise<AuthSession> {
  return requestJson<AuthSession>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signOut(): Promise<void> {
  await requestJson<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await requestJson<AuthUser>('/api/auth/me');
  } catch {
    return null;
  }
}

export async function getSearchHistory(limit = 20): Promise<SearchHistoryItem[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    return await requestJson<SearchHistoryItem[]>(`/api/auth/history?${params.toString()}`);
  } catch {
    return [];
  }
}

export async function recordSearch(payload: SearchHistoryCreate): Promise<SearchHistoryItem | null> {
  try {
    return await requestJson<SearchHistoryItem>('/api/auth/history', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}