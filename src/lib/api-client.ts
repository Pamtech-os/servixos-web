import { fetchJson, HttpError } from '@/common/network/http-client';
import { tokenStore } from './token-store';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `https://${process.env.NEXT_PUBLIC_API_BASE_URL}`
  : 'https://api-dev.servixos.com/api';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

// ─── Response envelope ────────────────────────────────────────────────────────

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
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

export interface BusinessCategory {
  _id: string;
  name: string;
  slug: string;
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

function publicHeaders(): Record<string, string> {
  return { 'x-api-key': API_KEY };
}

async function publicGet<T>(path: string): Promise<T> {
  const envelope = await fetchJson<ApiEnvelope<T>>(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: publicHeaders(),
  });
  return envelope.data;
}

async function publicCall<T>(path: string, body: unknown): Promise<T> {
  const envelope = await fetchJson<ApiEnvelope<T>>(`${BASE_URL}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: publicHeaders(),
  });
  return envelope.data;
}

// ─── Silent token refresh (deduplicates concurrent calls) ─────────────────────

let _refreshPromise: Promise<string> | null = null;

async function silentRefresh(): Promise<string> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) throw new Error('Session expired. Please log in again.');

    const envelope = await fetchJson<ApiEnvelope<{ accessToken: string }>>(
      `${BASE_URL}/auth/refresh`,
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        headers: { 'x-api-key': API_KEY },
      }
    );
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
    fetchJson<ApiEnvelope<T>>(`${BASE_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'x-api-key': API_KEY,
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
    const envelope = await fetchJson<ApiEnvelope<{ accessToken: string }>>(
      `${BASE_URL}/auth/verify-pin`,
      {
        method: 'POST',
        body: JSON.stringify({ pin }),
        headers: { 'x-api-key': API_KEY, Authorization: `Bearer ${token}` },
      }
    );
    return envelope.data.accessToken;
  },

  refresh: (refreshToken: string) =>
    fetchJson<ApiEnvelope<{ accessToken: string }>>(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: { 'x-api-key': API_KEY },
    }).then((env) => env.data.accessToken),

  logout: (refreshToken: string): void => {
    void fetchJson(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: { 'x-api-key': API_KEY },
    }).catch(() => {});
  },

  forgotPassword: (email: string) =>
    publicCall<null>('/auth/forgot-password', { email }),

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
