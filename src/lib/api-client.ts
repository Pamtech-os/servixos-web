import { fetchJson, HttpError } from '@/common/network/http-client';
import { tokenStore } from './token-store';
import type { PaginationMeta } from './pagination';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `https://${process.env.NEXT_PUBLIC_API_BASE_URL}`
  : 'https://api-dev.servixos.com/api';

const CLIENT_TOKEN_PATH = '/auth/client-token';
const CLIENT_TOKEN_REFRESH_BUFFER_MS = 5_000;

// ─── Response envelope ────────────────────────────────────────────────────────

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  businessId: string;
  userRole: 'owner' | 'employee';
  pinVerified: boolean;
  iat: number;
  exp: number;
}

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  businessId: string;
  subdomain?: string;
}

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

// ─── Onboarding input types ───────────────────────────────────────────────────

export interface CreateAccountInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export interface SetPinInput {
  email: string;
  pin: string;
  confirmPin: string;
}

export interface CreateBusinessInput {
  email: string;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  colorPrimary?: string;
  colorSecondary?: string;
  font?: string;
  services?: string[];
  timezone: string;
}

// ─── Auth input types ─────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  otp: string;
  newPassword: string;
}

export interface WebsiteGenerateResult {
  subdomain: string;
  url: string;
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedListResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─── Activity Logs types ──────────────────────────────────────────────────────

export type ActivityLogCategory =
  | 'auth'
  | 'client'
  | 'job'
  | 'invoice'
  | 'payment'
  | 'settings'
  | 'role'
  | 'employee'
  | 'task'
  | 'request'
  | 'website';

export interface ActivityLog {
  _id: string;
  businessId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  category: ActivityLogCategory;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  city?: string;
  country?: string;
  timestamp: string;
  createdAt: string;
}

export interface ActivityLogsQuery {
  search?: string;
  category?: ActivityLogCategory;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface BusinessCategory {
  _id: string;
  name: string;
  slug: string;
}

interface ClientTokenData {
  token: string;
  expiresAt: number;
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

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

// ─── Request helpers ──────────────────────────────────────────────────────────

let _clientToken: ClientTokenData | null = null;
let _clientTokenPromise: Promise<ClientTokenData> | null = null;

function isClientTokenValid(tokenData: ClientTokenData | null): tokenData is ClientTokenData {
  if (!tokenData) return false;
  return Date.now() < tokenData.expiresAt - CLIENT_TOKEN_REFRESH_BUFFER_MS;
}

async function getClientToken(forceRefresh = false): Promise<ClientTokenData> {
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

function buildPathWithQuery(url: string): string {
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

function buildCanonicalString(
  method: string,
  pathWithQuery: string,
  timestamp: string,
  body: string
): string {
  return [method.toUpperCase(), pathWithQuery, timestamp, body].join('\n');
}

async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
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
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

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

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipSigning?: boolean;
};

async function requestEnvelope<T>({
  method,
  path,
  body,
  headers = {},
  skipSigning = false,
}: RequestOptions): Promise<ApiEnvelope<T>> {
  const url = `${BASE_URL}${path}`;
  const bodyString = body === undefined ? undefined : JSON.stringify(body);

  const send = async (forceRefreshClientToken = false): Promise<ApiEnvelope<T>> => {
    const requestHeaders: Record<string, string> = { ...headers };

    if (!skipSigning) {
      const { token } = await getClientToken(forceRefreshClientToken);
      const timestamp = Date.now().toString();
      const canonical = buildCanonicalString(
        method,
        buildPathWithQuery(url),
        timestamp,
        buildCanonicalBody(body)
      );

      requestHeaders['x-client-token'] = token;
      requestHeaders['x-timestamp'] = timestamp;
      requestHeaders['x-signature'] = await hmacSha256Hex(canonical, token);
    }

    return fetchJson<ApiEnvelope<T>>(url, {
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

async function publicGet<T>(path: string): Promise<T> {
  const envelope = await requestEnvelope<T>({ method: 'GET', path });
  return envelope.data;
}

async function publicCall<T>(path: string, body: unknown): Promise<T> {
  const envelope = await requestEnvelope<T>({ method: 'POST', path, body });
  return envelope.data;
}

// ─── Silent token refresh (deduplicates concurrent calls) ─────────────────────

let _refreshPromise: Promise<string> | null = null;

async function silentRefresh(): Promise<string> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) throw new Error('Session expired. Please log in again.');

    const envelope = await requestEnvelope<{ accessToken: string }>({
      method: 'POST',
      path: '/auth/refresh',
      body: { refreshToken },
    });
    const newToken = envelope.data.accessToken;
    tokenStore.setAccessToken(newToken);
    return newToken;
  })().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}

async function resolveToken(): Promise<string> {
  const current = tokenStore.getAccessToken();
  if (current && !isTokenExpired(current)) return current;
  return silentRefresh();
}

async function protectedCall<T>(
  path: string,
  businessId: string,
  body: unknown = {}
): Promise<T> {
  const token = await resolveToken();

  const makeRequest = (t: string) =>
    requestEnvelope<T>({
      method: 'POST',
      path,
      body,
      headers: {
        Authorization: `Bearer ${t}`,
        'x-business-id': businessId,
      },
    });

  try {
    const envelope = await makeRequest(token);
    return envelope.data;
  } catch (err) {
    if (err instanceof HttpError && err.status === 401) {
      const refreshed = await silentRefresh();
      const envelope = await makeRequest(refreshed);
      return envelope.data;
    }
    throw err;
  }
}

async function protectedGet<T>(
  path: string,
  businessId: string,
): Promise<ApiEnvelope<T>> {
  const token = await resolveToken();

  const makeRequest = (t: string) =>
    requestEnvelope<T>({
      method: 'GET',
      path,
      headers: {
        Authorization: `Bearer ${t}`,
        'x-business-id': businessId,
      },
    });

  try {
    return await makeRequest(token);
  } catch (err) {
    if (err instanceof HttpError && err.status === 401) {
      const refreshed = await silentRefresh();
      return makeRequest(refreshed);
    }
    throw err;
  }
}

// ─── Onboarding API ───────────────────────────────────────────────────────────

export const onboarding = {
  createAccount: (input: CreateAccountInput) =>
    publicCall<null>('/auth/onboarding/account', input),

  verifyEmail: (input: VerifyEmailInput) =>
    publicCall<null>('/auth/onboarding/verify-email', input),

  resendOtp: (email: string) =>
    publicCall<null>('/auth/onboarding/resend-otp', { email }),

  setPin: (input: SetPinInput) =>
    publicCall<null>('/auth/onboarding/set-pin', input),

  createBusiness: (input: CreateBusinessInput) =>
    publicCall<SessionData>('/auth/onboarding/business', input),
};

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const auth = {
  login: (input: LoginInput) => publicCall<SessionData>('/auth/login', input),

  verifyPin: async (pin: string, token: string): Promise<string> => {
    const envelope = await requestEnvelope<{ accessToken: string }>({
      method: 'POST',
      path: '/auth/verify-pin',
      body: { pin },
      headers: { Authorization: `Bearer ${token}` },
    });
    return envelope.data.accessToken;
  },

  refresh: (refreshToken: string) =>
    requestEnvelope<{ accessToken: string }>({
      method: 'POST',
      path: '/auth/refresh',
      body: { refreshToken },
    }).then((env) => env.data.accessToken),

  logout: (refreshToken: string): void => {
    void requestEnvelope<null>({
      method: 'POST',
      path: '/auth/logout',
      body: { refreshToken },
    }).catch(() => {});
  },

  forgotPassword: async (email: string): Promise<string> => {
    const envelope = await requestEnvelope<null>({
      method: 'POST',
      path: '/auth/forgot-password',
      body: { email },
    });
    return envelope.message;
  },

  resetPassword: (input: ResetPasswordInput) =>
    publicCall<null>('/auth/reset-password', input),
};

// ─── Website API ──────────────────────────────────────────────────────────────

export const website = {
  generate: (businessId: string) =>
    protectedCall<WebsiteGenerateResult>('/website/generate', businessId),
};

// ─── Business Categories API ──────────────────────────────────────────────────

export const categories = {
  list: () => publicGet<BusinessCategory[]>('/business-categories'),
};

// ─── Activity Logs API ────────────────────────────────────────────────────────

export const activityLogs = {
  list: async (
    businessId: string,
    query: ActivityLogsQuery = {},
  ): Promise<{ data: ActivityLog[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.category) params.set('category', query.category);
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params.set('dateTo', query.dateTo);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/activity-logs${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<ActivityLog[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },
};
