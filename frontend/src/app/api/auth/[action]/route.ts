import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE = 'nutriscan_auth_token';
const BACKEND_URL =
  process.env.NUTRISCAN_BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'http://127.0.0.1:8000';

function authHeader(request: NextRequest): Record<string, string> {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonResponse(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status });
}

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

async function forwardToBackend(
  request: NextRequest,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  options: { body?: string; authorize?: boolean } = {},
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.authorize) {
    Object.assign(headers, authHeader(request));
  }

  const backendResponse = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: options.body,
  });

  const payload = await backendResponse.json().catch(() => ({}));
  const response = jsonResponse(payload, backendResponse.status);

  if ((path === '/auth/login' || path === '/auth/signup') && backendResponse.ok) {
    const token = typeof payload === 'object' && payload && 'access_token' in payload ? String((payload as { access_token?: unknown }).access_token || '') : '';
    if (token) {
      setSessionCookie(response, token);
    }
  }

  if (path === '/auth/logout') {
    clearSessionCookie(response);
  }

  return response;
}

export async function GET(request: NextRequest, context: { params: { action: string } }) {
  const { action } = context.params;

  if (action === 'me') {
    return forwardToBackend(request, 'GET', '/auth/me', { authorize: true });
  }

  if (action === 'history') {
    const limit = request.nextUrl.searchParams.get('limit');
    const suffix = limit ? `?limit=${encodeURIComponent(limit)}` : '';
    return forwardToBackend(request, 'GET', `/auth/history${suffix}`, { authorize: true });
  }

  return jsonResponse({ error: 'Not found.' }, 404);
}

export async function POST(request: NextRequest, context: { params: { action: string } }) {
  const { action } = context.params;

  if (action === 'login' || action === 'signup' || action === 'history') {
    const body = await request.text();
    return forwardToBackend(request, 'POST', `/auth/${action}`, {
      body,
      authorize: action === 'history',
    });
  }

  if (action === 'logout') {
    return forwardToBackend(request, 'POST', '/auth/logout', { authorize: true });
  }

  return jsonResponse({ error: 'Not found.' }, 404);
}

export async function DELETE(request: NextRequest, context: { params: { action: string } }) {
  const { action } = context.params;

  if (action === 'logout') {
    return forwardToBackend(request, 'DELETE', '/auth/logout', { authorize: true });
  }

  return jsonResponse({ error: 'Not found.' }, 404);
}