// This module uses browser-only APIs (SubtleCrypto, navigator.onLine, sessionStorage).
// Only call these functions from client-side code ('use client' components or hooks).

import { fetchJson, HttpError } from '@/common/network/http-client';
import { tokenStore } from '@/lib/token-store';
import type { PaginationMeta } from '@/lib/pagination';

// Always the real external API URL — used for request signing path extraction.
// The server validates the signature against the path it receives, which is the real API path.
// NEXT_PUBLIC_API_BASE_URL must be a full URL (e.g. https://api-dev.servixos.com/api).
const REAL_API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api-dev.servixos.com/api';

// In the browser, route through the same-origin proxy so the browser stores and
// forwards the access_token cookie correctly (cross-origin SameSite restrictions
// otherwise block it). next.config.ts rewrites /api-proxy/* → REAL_API_URL/*.
// On the server (SSR), call the external URL directly — no rewrite available.
export const BASE_URL =
  typeof window !== 'undefined' ? '/api-proxy' : REAL_API_URL;

const CLIENT_TOKEN_PATH = '/auth/client-token';
const CLIENT_TOKEN_REFRESH_BUFFER_MS = 5_000;

// ─── Response envelope ────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  statistics?: Record<string, number>;
  weekStartDate?: string;
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedListResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  businessId: string;
  userRole: 'owner' | 'employee' | 'client';
  pinVerified: boolean;
  iat: number;
  exp: number;
}

export function decodeJwt(token: string): JwtPayload {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64)) as JwtPayload;
}

export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = decodeJwt(token);
    return Date.now() >= (exp - 60) * 1000; // 60s early-refresh buffer
  } catch {
    return true;
  }
}

// ─── Client token ─────────────────────────────────────────────────────────────

interface ClientTokenData {
  token: string;
  expiresAt: number;
}

let _clientToken: ClientTokenData | null = null;
let _clientTokenPromise: Promise<ClientTokenData> | null = null;

function isClientTokenValid(tokenData: ClientTokenData | null): tokenData is ClientTokenData {
  if (!tokenData) return false;
  return Date.now() < tokenData.expiresAt - CLIENT_TOKEN_REFRESH_BUFFER_MS;
}

export async function getClientToken(forceRefresh = false): Promise<ClientTokenData> {
  if (!forceRefresh && isClientTokenValid(_clientToken)) return _clientToken;
  if (_clientTokenPromise) return _clientTokenPromise;

  _clientTokenPromise = (async () => {
    const envelope = await fetchJson<ApiEnvelope<ClientTokenData>>(
      `${BASE_URL}${CLIENT_TOKEN_PATH}`,
      { method: 'GET' }
    );
    _clientToken = envelope.data;
    return envelope.data;
  })().finally(() => {
    _clientTokenPromise = null;
  });

  return _clientTokenPromise;
}

// ─── Request signing ──────────────────────────────────────────────────────────

export function buildPathWithQuery(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

function buildCanonicalBody(body: unknown): string {
  if (body == null) return '';

  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) return '';
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length === 0) return '';
      return JSON.stringify(parsed);
    } catch {
      return trimmed;
    }
  }

  if (typeof body === 'object') {
    return Object.keys(body).length > 0 ? JSON.stringify(body) : '';
  }

  return JSON.stringify(body);
}

export function buildCanonicalString(
  method: string,
  pathWithQuery: string,
  timestamp: string,
  body: string
): string {
  return [method.toUpperCase(), pathWithQuery, timestamp, body].join('\n');
}

export async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is unavailable for request signing.');
  }

  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payload));

  return Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function isSignatureTokenError(err: HttpError): boolean {
  if (err.status !== 401) return false;
  const message = err.message.toLowerCase();
  if (!message) return true;
  if (message.includes('signature') || message.includes('client token')) return true;
  if (message.includes('invalid') && message.includes('token')) return true;
  if (message.includes('expired') && message.includes('token')) return true;
  return false;
}

// ─── Core request ─────────────────────────────────────────────────────────────

export type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipSigning?: boolean;
};

export async function requestEnvelope<T>({
  method,
  path,
  body,
  headers = {},
  skipSigning = false,
}: RequestOptions): Promise<ApiEnvelope<T>> {
  // fetchUrl goes through the same-origin proxy (browser) so cookies are stored/sent.
  // signUrl uses the real external URL so the HMAC path matches what the server sees.
  const fetchUrl = `${BASE_URL}${path}`;
  const signUrl = `${REAL_API_URL}${path}`;
  const bodyString = body === undefined ? undefined : JSON.stringify(body);

  const send = async (forceRefreshClientToken = false): Promise<ApiEnvelope<T>> => {
    const requestHeaders: Record<string, string> = { ...headers };

    if (!skipSigning) {
      const { token } = await getClientToken(forceRefreshClientToken);
      const timestamp = Date.now().toString();
      const canonical = buildCanonicalString(
        method,
        buildPathWithQuery(signUrl),
        timestamp,
        buildCanonicalBody(body)
      );

      requestHeaders['x-client-token'] = token;
      requestHeaders['x-timestamp'] = timestamp;
      requestHeaders['x-signature'] = await hmacSha256Hex(canonical, token);
    }

    return fetchJson<ApiEnvelope<T>>(fetchUrl, {
      method,
      body: bodyString,
      headers: requestHeaders,
    });
  };

  try {
    return await send(false);
  } catch (err) {
    if (!skipSigning && err instanceof HttpError && isSignatureTokenError(err)) {
      return send(true);
    }
    throw err;
  }
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export async function publicGet<T>(path: string): Promise<T> {
  const envelope = await requestEnvelope<T>({ method: 'GET', path });
  return envelope.data;
}

export async function publicCall<T>(path: string, body: unknown): Promise<T> {
  const envelope = await requestEnvelope<T>({ method: 'POST', path, body });
  return envelope.data;
}

// ─── Token refresh ────────────────────────────────────────────────────────────

let _refreshPromise: Promise<void> | null = null;

async function silentRefresh(): Promise<void> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = requestEnvelope<{ accessToken: string }>({
    method: 'POST',
    path: '/auth/refresh',
    body: {},
  }).then(() => {}).finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}

// ─── Protected helpers ────────────────────────────────────────────────────────

export async function protectedGet<T>(path: string, businessId: string): Promise<ApiEnvelope<T>> {
  const make = () =>
    requestEnvelope<T>({
      method: 'GET',
      path,
      headers: { 'x-business-id': businessId },
    });

  try {
    return await make();
  } catch (err) {
    if (!(err instanceof HttpError) || err.status !== 401) throw err;

    try {
      await silentRefresh();
    } catch {
      tokenStore.notifyExpired();
      throw err;
    }

    try {
      return await make();
    } catch (retryErr) {
      if (retryErr instanceof HttpError && retryErr.status === 401) tokenStore.notifyExpired();
      throw retryErr;
    }
  }
}

export async function protectedRequest<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  businessId: string,
  body?: unknown
): Promise<T> {
  const make = () =>
    requestEnvelope<T>({
      method,
      path,
      body,
      headers: { 'x-business-id': businessId },
    });

  try {
    const envelope = await make();
    return envelope.data;
  } catch (err) {
    if (!(err instanceof HttpError) || err.status !== 401) throw err;

    try {
      await silentRefresh();
    } catch {
      tokenStore.notifyExpired();
      throw err;
    }

    try {
      const envelope = await make();
      return envelope.data;
    } catch (retryErr) {
      if (retryErr instanceof HttpError && retryErr.status === 401) tokenStore.notifyExpired();
      throw retryErr;
    }
  }
}
