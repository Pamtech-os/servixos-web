import { fetchJson, HttpError, RequestTimeoutError } from '@/common/network/http-client';
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
  statistics?: Record<string, number>;
  weekStartDate?: string;
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  businessId: string;
  userRole: 'owner' | 'employee' | 'client';
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
  mustChangePassword?: boolean;
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

export interface CompleteSetupInput {
  newPassword: string;
  confirmPassword: string;
  pin: string;
  confirmPin: string;
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

// ─── Roles & Permissions types ────────────────────────────────────────────────

export type Permission = string;

export interface Role {
  _id: string;
  businessId: string;
  name: string;
  permissions: Permission[];
  isSystem: boolean;
  isOwnerRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  permissions: Permission[];
}

export interface UpdateRoleInput {
  name?: string;
  permissions?: Permission[];
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

// ─── Silent token refresh (temporarily disabled) ──────────────────────────────

// let _refreshPromise: Promise<string> | null = null;

// async function silentRefresh(): Promise<string> {
//   if (_refreshPromise) return _refreshPromise;
//
//   _refreshPromise = (async () => {
//     const refreshToken = tokenStore.getRefreshToken();
//     if (!refreshToken) throw new Error('Session expired. Please log in again.');
//
//     const envelope = await requestEnvelope<{ accessToken: string }>({
//       method: 'POST',
//       path: '/auth/refresh',
//       body: { refreshToken },
//     });
//     const newToken = envelope.data.accessToken;
//     tokenStore.setAccessToken(newToken);
//     return newToken;
//   })().finally(() => {
//     _refreshPromise = null;
//   });
//
//   return _refreshPromise;
// }

async function resolveToken(): Promise<string> {
  const current = tokenStore.getAccessToken();
  if (current && !isTokenExpired(current)) return current;
  tokenStore.notifyExpired();
  throw new Error('Session expired. Please re-verify your PIN.');
}

async function protectedCall<T>(path: string, businessId: string, body: unknown = {}): Promise<T> {
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

  const envelope = await makeRequest(token);
  return envelope.data;
}

async function protectedRequest<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  businessId: string,
  body?: unknown
): Promise<T> {
  const token = await resolveToken();

  const makeRequest = (t: string) =>
    requestEnvelope<T>({
      method,
      path,
      body,
      headers: {
        Authorization: `Bearer ${t}`,
        'x-business-id': businessId,
      },
    });

  const envelope = await makeRequest(token);
  return envelope.data;
}

async function protectedGet<T>(path: string, businessId: string): Promise<ApiEnvelope<T>> {
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

  return makeRequest(token);
}

// ─── Onboarding API ───────────────────────────────────────────────────────────

export const onboarding = {
  createAccount: (input: CreateAccountInput) => publicCall<null>('/auth/onboarding/account', input),

  verifyEmail: (input: VerifyEmailInput) =>
    publicCall<null>('/auth/onboarding/verify-email', input),

  resendOtp: (email: string) => publicCall<null>('/auth/onboarding/resend-otp', { email }),

  setPin: (input: SetPinInput) => publicCall<null>('/auth/onboarding/set-pin', input),

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

  completeSetup: async (input: CompleteSetupInput, token: string): Promise<string> => {
    const envelope = await requestEnvelope<{ accessToken: string }>({
      method: 'POST',
      path: '/auth/complete-setup',
      body: input,
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

  resetPassword: (input: ResetPasswordInput) => publicCall<null>('/auth/reset-password', input),
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

// ─── Permissions API ─────────────────────────────────────────────────────────

export const permissions = {
  list: async (businessId: string): Promise<Permission[]> => {
    const envelope = await protectedGet<Permission[]>('/permissions', businessId);
    return envelope.data;
  },
};

// ─── Roles API ────────────────────────────────────────────────────────────────

export const roles = {
  list: async (businessId: string): Promise<Role[]> => {
    const envelope = await protectedGet<Role[]>('/roles', businessId);
    return envelope.data;
  },

  get: async (businessId: string, id: string): Promise<Role> => {
    const envelope = await protectedGet<Role>(`/roles/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateRoleInput): Promise<Role> =>
    protectedRequest<Role>('POST', '/roles', businessId, input),

  update: (businessId: string, id: string, input: UpdateRoleInput): Promise<Role> =>
    protectedRequest<Role>('PATCH', `/roles/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/roles/${id}`, businessId),
};

// ─── Employees & Time Tracking types ─────────────────────────────────────────

export type EmployeeClockStatus = 'clocked_in' | 'clocked_out' | 'on_break';

export interface Employee {
  _id: string;
  businessId: string;
  userId?: string;
  roleId: string;
  fullName: string;
  email: string;
  phone?: string;
  weeklyHoursTarget: number;
  dateJoined?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeesQuery {
  search?: string;
  roleId?: string;
  page?: number;
  limit?: number;
}

export interface CreateEmployeeInput {
  fullName: string;
  email: string;
  phone?: string;
  roleId: string;
  weeklyHoursTarget: number;
  dateJoined?: string;
}

export interface UpdateEmployeeInput {
  fullName?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  weeklyHoursTarget?: number;
  dateJoined?: string;
}

export interface OnlineEmployee {
  _id: string;
  fullName: string;
  email: string;
  clockStatus: EmployeeClockStatus;
}

export interface ClockRecord {
  _id: string;
  businessId: string;
  employeeId: string;
  clockInAt: string;
  clockOutAt?: string | null;
  breakMinutes: number;
  breakStartedAt?: string | null;
  status: EmployeeClockStatus;
  totalHours?: number;
  timezone: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeClockHistoryQuery {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ClockStatusData {
  status: EmployeeClockStatus;
  clockInAt?: string | null;
  breakMinutes: number;
  currentRecord?: ClockRecord | null;
}

// ─── Employees & Time Tracking API ───────────────────────────────────────────

export const employees = {
  list: async (
    businessId: string,
    query: EmployeesQuery = {}
  ): Promise<{ data: Employee[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.roleId) params.set('roleId', query.roleId);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/staff${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Employee[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  online: async (businessId: string): Promise<OnlineEmployee[]> => {
    const envelope = await protectedGet<unknown>('/staff/online', businessId);
    const payload = envelope.data as unknown;

    if (Array.isArray(payload)) {
      return payload as OnlineEmployee[];
    }

    if (
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as { data?: unknown }).data)
    ) {
      return (payload as { data: OnlineEmployee[] }).data;
    }

    return [];
  },

  get: async (businessId: string, id: string): Promise<Employee> => {
    const envelope = await protectedGet<Employee>(`/staff/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateEmployeeInput): Promise<Employee> =>
    protectedRequest<Employee>('POST', '/staff', businessId, input),

  update: (businessId: string, id: string, input: UpdateEmployeeInput): Promise<Employee> =>
    protectedRequest<Employee>('PATCH', `/staff/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/staff/${id}`, businessId),

  getClockHistory: async (
    businessId: string,
    id: string,
    query: EmployeeClockHistoryQuery = {}
  ): Promise<{ data: ClockRecord[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/staff/${id}/clock-history${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<ClockRecord[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },
};

export const clock = {
  in: (businessId: string, employeeId: string): Promise<ClockRecord> =>
    protectedRequest<ClockRecord>('POST', '/clock/in', businessId, { employeeId }),

  out: (businessId: string, employeeId: string): Promise<ClockRecord> =>
    protectedRequest<ClockRecord>('POST', '/clock/out', businessId, { employeeId }),

  startBreak: (businessId: string, employeeId: string): Promise<ClockRecord> =>
    protectedRequest<ClockRecord>('POST', '/clock/break/start', businessId, { employeeId }),

  endBreak: (
    businessId: string,
    employeeId: string,
    breakDurationMinutes: number
  ): Promise<ClockRecord> =>
    protectedRequest<ClockRecord>('POST', '/clock/break/end', businessId, {
      employeeId,
      breakDurationMinutes,
    }),

  status: async (businessId: string, employeeId: string): Promise<ClockStatusData> => {
    const envelope = await protectedGet<ClockStatusData>(
      `/clock/status/${employeeId}`,
      businessId
    );
    return envelope.data;
  },
};

// ─── Service Requests types ───────────────────────────────────────────────────

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface AiPriceEstimate {
  suggestedPrice: number;
  lowPrice: number;
  highPrice: number;
  confidence: 'low' | 'medium' | 'high';
  currency: string;
  reasoning: string;
}

export interface ServiceRequest {
  _id: string;
  businessId: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  service: string;
  requestedDate: string;
  requestedEndDate?: string;
  message?: string;
  status: RequestStatus;
  quotedPrice?: number;
  startDate?: string;
  endDate?: string;
  actionedAt?: string;
  actionedBy?: string;
  conversationId?: string;
  aiPriceEstimate?: AiPriceEstimate;
  hasAiPriceEstimate: boolean;
  aiPriceEstimatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestStatistics {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
}

export interface ServiceRequestsQuery {
  status?: RequestStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RequestConversation {
  _id: string;
  businessId: string;
  clientId: string;
  lastMessageContent: string;
  lastMessageAt: string | null;
  businessUnreadCount: number;
  clientUnreadCount: number;
}

export interface UpdateRequestInput {
  status?: 'accepted' | 'rejected' | 'cancelled';
  quotedPrice?: number;
  startDate?: string;
  endDate?: string;
}

// ─── Service Requests API ────────────────────────────────────────────────────

export const serviceRequests = {
  list: async (
    businessId: string,
    query: ServiceRequestsQuery = {}
  ): Promise<{ data: ServiceRequest[]; meta: PaginationMeta; statistics: RequestStatistics }> => {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.search) params.set('search', query.search);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/requests${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<ServiceRequest[]>(path, businessId);
    const stats = envelope.statistics as RequestStatistics | undefined;
    return {
      data: envelope.data,
      meta: envelope.meta!,
      statistics: stats ?? { total: 0, pending: 0, accepted: 0, rejected: 0, cancelled: 0 },
    };
  },

  get: async (businessId: string, id: string): Promise<ServiceRequest> => {
    const envelope = await protectedGet<ServiceRequest>(`/requests/${id}`, businessId);
    return envelope.data;
  },

  getConversation: async (businessId: string, id: string): Promise<RequestConversation> => {
    const envelope = await protectedGet<RequestConversation>(
      `/requests/${id}/conversation`,
      businessId
    );
    return envelope.data;
  },

  getPriceEstimate: async (businessId: string, id: string): Promise<AiPriceEstimate> => {
    const envelope = await protectedGet<AiPriceEstimate>(
      `/requests/${id}/price-estimate`,
      businessId
    );
    return envelope.data;
  },

  update: (businessId: string, id: string, input: UpdateRequestInput): Promise<ServiceRequest> =>
    protectedRequest<ServiceRequest>('PATCH', `/requests/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/requests/${id}`, businessId),
};

// ─── Clients types ────────────────────────────────────────────────────────────

export interface Client {
  _id: string;
  businessId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientsQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ClientExportResult {
  exportUrl: string;
}

// ─── Clients API ──────────────────────────────────────────────────────────────

export const clients = {
  list: async (
    businessId: string,
    query: ClientsQuery = {}
  ): Promise<{ data: Client[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/clients${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Client[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  get: async (businessId: string, id: string): Promise<Client> => {
    const envelope = await protectedGet<Client>(`/clients/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateClientInput): Promise<Client> =>
    protectedRequest<Client>('POST', '/clients', businessId, input),

  update: (businessId: string, id: string, input: UpdateClientInput): Promise<Client> =>
    protectedRequest<Client>('PATCH', `/clients/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/clients/${id}`, businessId),

  export: async (businessId: string, id: string): Promise<ClientExportResult> => {
    const envelope = await protectedGet<ClientExportResult>(`/clients/${id}/export`, businessId);
    return envelope.data;
  },
};

// ─── Jobs types ───────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Job {
  _id: string;
  businessId: string;
  clientId: string;
  sourceRequestId?: string;
  title: string;
  description?: string;
  scheduledDate: string;
  location?: string;
  price?: number;
  notes?: string;
  status: JobStatus;
  startedAt?: string;
  completedAt?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled';

export interface Contract {
  _id: string;
  businessId: string;
  jobId: string;
  clientId: string;
  title: string;
  html?: string;
  pdfUrl?: string;
  amount: number;
  expiresAt?: string;
  status: ContractStatus;
  sentAt?: string;
  signedAt?: string;
  signingUrl?: string;
  clientAppDeliveredAt?: string;
  timezone: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractsQuery {
  clientId?: string;
  status?: ContractStatus;
  page?: number;
  limit?: number;
}

export interface CreateContractInput {
  clientId: string;
  jobId: string;
  name: string;
  amount: number;
  expiresAt?: string;
}

export interface UpdateContractInput {
  status?: ContractStatus;
  signedAt?: string;
}

export interface JobsQuery {
  search?: string;
  clientId?: string;
  status?: JobStatus;
  page?: number;
  limit?: number;
}

export interface CreateJobInput {
  clientId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  location?: string;
  price?: number;
  notes?: string;
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  scheduledDate?: string;
  location?: string;
  price?: number;
  notes?: string;
}

export interface BulkDeleteResult {
  deletedCount: number;
}

// ─── Jobs API ─────────────────────────────────────────────────────────────────

export const jobs = {
  list: async (
    businessId: string,
    query: JobsQuery = {}
  ): Promise<{ data: Job[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.clientId) params.set('clientId', query.clientId);
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/jobs${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Job[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  get: async (businessId: string, id: string): Promise<Job> => {
    const envelope = await protectedGet<Job>(`/jobs/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateJobInput): Promise<Job> =>
    protectedRequest<Job>('POST', '/jobs', businessId, input),

  update: (businessId: string, id: string, input: UpdateJobInput): Promise<Job> =>
    protectedRequest<Job>('PATCH', `/jobs/${id}`, businessId, input),

  start: (businessId: string, id: string): Promise<Job> =>
    protectedRequest<Job>('PATCH', `/jobs/${id}/start`, businessId),

  complete: (businessId: string, id: string): Promise<Job> =>
    protectedRequest<Job>('PATCH', `/jobs/${id}/complete`, businessId),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/jobs/${id}`, businessId),

  bulkDelete: (businessId: string, ids: string[]): Promise<BulkDeleteResult> =>
    protectedRequest<BulkDeleteResult>('DELETE', '/jobs', businessId, { ids }),
};

// ─── Contracts API ────────────────────────────────────────────────────────────

export const contracts = {
  list: async (
    businessId: string,
    query: ContractsQuery = {}
  ): Promise<{ data: Contract[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.clientId) params.set('clientId', query.clientId);
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/contracts${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Contract[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  get: async (businessId: string, id: string): Promise<Contract> => {
    const envelope = await protectedGet<Contract>(`/contracts/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateContractInput): Promise<Contract> =>
    protectedRequest<Contract>('POST', '/contracts', businessId, input),

  update: (businessId: string, id: string, input: UpdateContractInput): Promise<Contract> =>
    protectedRequest<Contract>('PATCH', `/contracts/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/contracts/${id}`, businessId),

  getPdf: async (businessId: string, id: string): Promise<{ url: string }> => {
    const envelope = await protectedGet<{ url: string }>(`/contracts/${id}/pdf`, businessId);
    return envelope.data;
  },

  send: (businessId: string, id: string, clientEmail: string): Promise<{ queued: boolean }> =>
    protectedRequest<{ queued: boolean }>('POST', `/contracts/${id}/send`, businessId, {
      clientEmail,
    }),
};

// ─── Invoices types ───────────────────────────────────────────────────────────

export type InvoiceStatus = 'pending' | 'partial' | 'paid';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceClient {
  _id: string;
  email: string;
  name: string;
}

export interface Invoice {
  _id: string;
  businessId: string;
  clientId: InvoiceClient | string;
  jobId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate?: string;
  lineItems: InvoiceLineItem[];
  taxRate: number;
  totalAmount: number;
  amountPaid: number;
  pdfUrl?: string;
  sentAt?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceStatistics {
  totalCollected: number;
  outstanding: number;
}

export interface InvoicesQuery {
  search?: string;
  clientId?: string;
  status?: InvoiceStatus;
  page?: number;
  limit?: number;
}

export interface CreateInvoiceInput {
  clientId: string;
  invoiceDate: string;
  dueDate?: string;
  lineItems: InvoiceLineItem[];
  taxRate?: number;
  jobId?: string;
}

export interface UpdateInvoiceInput {
  status?: InvoiceStatus;
  dueDate?: string;
  lineItems?: InvoiceLineItem[];
  taxRate?: number;
}

// ─── Invoices API ─────────────────────────────────────────────────────────────

export const invoices = {
  list: async (
    businessId: string,
    query: InvoicesQuery = {}
  ): Promise<{ data: Invoice[]; meta: PaginationMeta; statistics: InvoiceStatistics }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.clientId) params.set('clientId', query.clientId);
    if (query.status) params.set('status', query.status);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/invoices${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Invoice[]>(path, businessId);
    const stats = envelope.statistics as InvoiceStatistics | undefined;
    return {
      data: envelope.data,
      meta: envelope.meta!,
      statistics: stats ?? { totalCollected: 0, outstanding: 0 },
    };
  },

  get: async (businessId: string, id: string): Promise<Invoice> => {
    const envelope = await protectedGet<Invoice>(`/invoices/${id}`, businessId);
    return envelope.data;
  },

  getPdf: async (businessId: string, id: string): Promise<{ pdfUrl: string }> => {
    const envelope = await protectedGet<{ pdfUrl: string }>(`/invoices/${id}/pdf`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateInvoiceInput): Promise<Invoice> =>
    protectedRequest<Invoice>('POST', '/invoices', businessId, input),

  update: (businessId: string, id: string, input: UpdateInvoiceInput): Promise<Invoice> =>
    protectedRequest<Invoice>('PATCH', `/invoices/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/invoices/${id}`, businessId),

  send: (businessId: string, id: string): Promise<Invoice> =>
    protectedRequest<Invoice>('POST', `/invoices/${id}/send`, businessId),
};

// ─── Payments types ───────────────────────────────────────────────────────────

export type PaymentMode = 'cash' | 'bank_transfer' | 'credit_card' | 'cheque' | 'mobile_money';
export type PaymentStatus = 'completed' | 'partial';

export interface Payment {
  _id: string;
  businessId: string;
  invoiceId?: {
    _id: string;
    invoiceNumber: string;
  };
  clientId?: string;
  paymentDate: string;
  paymentMode: PaymentMode;
  amount: number;
  status: PaymentStatus;
  notes?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatistics {
  totalIncome: number;
  received: number;
  pending: number;
  overdue: number;
  outstanding: number;
}

export interface PaymentsQuery {
  search?: string;
  status?: PaymentStatus;
  paymentMode?: PaymentMode;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreatePaymentInput {
  invoiceId?: string;
  clientId?: string;
  paymentDate: string;
  paymentMode: PaymentMode;
  amount: number;
  status?: PaymentStatus;
  notes?: string;
}

export interface UpdatePaymentInput {
  invoiceId?: string;
  clientId?: string;
  paymentDate?: string;
  paymentMode?: PaymentMode;
  amount?: number;
  status?: PaymentStatus;
  notes?: string;
}

// ─── Payments API ─────────────────────────────────────────────────────────────

export const payments = {
  list: async (
    businessId: string,
    query: PaymentsQuery = {}
  ): Promise<{ data: Payment[]; meta: PaginationMeta; statistics: PaymentStatistics }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.paymentMode) params.set('paymentMode', query.paymentMode);
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params.set('dateTo', query.dateTo);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/payments${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Payment[]>(path, businessId);
    const stats = envelope.statistics as PaymentStatistics | undefined;
    return {
      data: envelope.data,
      meta: envelope.meta!,
      statistics: stats ?? { totalIncome: 0, received: 0, pending: 0, overdue: 0, outstanding: 0 },
    };
  },

  get: async (businessId: string, id: string): Promise<Payment> => {
    const envelope = await protectedGet<Payment>(`/payments/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreatePaymentInput): Promise<Payment> =>
    protectedRequest<Payment>('POST', '/payments', businessId, input),

  update: (businessId: string, id: string, input: UpdatePaymentInput): Promise<Payment> =>
    protectedRequest<Payment>('PATCH', `/payments/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/payments/${id}`, businessId),
};

// ─── Schedules types ─────────────────────────────────────────────────────────

export interface ShiftEmployee {
  _id: string;
  fullName: string;
}

export interface Shift {
  _id: string;
  businessId: string;
  employeeId: string | ShiftEmployee;
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  weekStartDate: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulesQuery {
  weekStartDate?: string;
  employeeId?: string;
}

export interface CreateShiftInput {
  employeeId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateShiftInput {
  employeeId?: string;
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

// ─── Schedules API ────────────────────────────────────────────────────────────

export const schedules = {
  list: async (
    businessId: string,
    query: SchedulesQuery = {}
  ): Promise<{ data: Shift[]; weekStartDate: string }> => {
    const params = new URLSearchParams();
    if (query.weekStartDate) params.set('weekStartDate', query.weekStartDate);
    if (query.employeeId) params.set('employeeId', query.employeeId);

    const qs = params.toString();
    const path = `/schedules${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Shift[]>(path, businessId);
    return {
      data: envelope.data,
      weekStartDate: envelope.weekStartDate ?? query.weekStartDate ?? '',
    };
  },

  create: (businessId: string, input: CreateShiftInput): Promise<Shift> =>
    protectedRequest<Shift>('POST', '/schedules', businessId, input),

  update: (businessId: string, id: string, input: UpdateShiftInput): Promise<Shift> =>
    protectedRequest<Shift>('PATCH', `/schedules/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/schedules/${id}`, businessId),
};

// ─── Tasks types ─────────────────────────────────────────────────────────────

export type TaskStage = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskActivityType =
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'comment_added'
  | 'subtask_added'
  | 'subtask_updated';

export interface TaskSubtask {
  _id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  _id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  businessId: string;
  assigneeId?: string | { _id: string; fullName: string };
  title: string;
  description?: string;
  stage: TaskStage;
  priority?: TaskPriority;
  dueDate?: string;
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskActivity {
  _id: string;
  businessId: string;
  taskId: string;
  actorId: string;
  actorName: string;
  type: TaskActivityType;
  description: string;
  metadata?: {
    stage?: TaskStage;
    assigneeId?: string;
    updatedFields?: string[];
    content?: string;
    subtaskId?: string;
    completed?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TasksQuery {
  assigneeId?: string;
  stage?: TaskStage;
  priority?: TaskPriority;
  dueDate?: string;
  page?: number;
  limit?: number;
}

export interface TaskActivitiesQuery {
  page?: number;
  limit?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeId?: string;
  stage: TaskStage;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  stage?: TaskStage;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

// ─── Tasks API ────────────────────────────────────────────────────────────────

export const tasks = {
  list: async (
    businessId: string,
    query: TasksQuery = {}
  ): Promise<{ data: Task[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.assigneeId) params.set('assigneeId', query.assigneeId);
    if (query.stage) params.set('stage', query.stage);
    if (query.priority) params.set('priority', query.priority);
    if (query.dueDate) params.set('dueDate', query.dueDate);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/tasks${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Task[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  get: async (businessId: string, id: string): Promise<Task> => {
    const envelope = await protectedGet<Task>(`/tasks/${id}`, businessId);
    return envelope.data;
  },

  getActivities: async (
    businessId: string,
    id: string,
    query: TaskActivitiesQuery = {}
  ): Promise<{ data: TaskActivity[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/tasks/${id}/activities${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<TaskActivity[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  create: (businessId: string, input: CreateTaskInput): Promise<Task> =>
    protectedRequest<Task>('POST', '/tasks', businessId, input),

  update: (businessId: string, id: string, input: UpdateTaskInput): Promise<Task> =>
    protectedRequest<Task>('PATCH', `/tasks/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/tasks/${id}`, businessId),

  addComment: (businessId: string, id: string, content: string): Promise<Task> =>
    protectedRequest<Task>('POST', `/tasks/${id}/comments`, businessId, { content }),

  addSubtask: (businessId: string, id: string, title: string): Promise<Task> =>
    protectedRequest<Task>('POST', `/tasks/${id}/subtasks`, businessId, { title }),

  toggleSubtask: (
    businessId: string,
    id: string,
    subtaskId: string,
    completed: boolean
  ): Promise<Task> =>
    protectedRequest<Task>('PATCH', `/tasks/${id}/subtasks/${subtaskId}`, businessId, {
      completed,
    }),
};

// ─── Team Messages types ─────────────────────────────────────────────────────

export interface TeamMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface TeamMessagesQuery {
  page?: number;
  limit?: number;
}

export interface SendTeamMessageInput {
  content: string;
}

// ─── Team Messages API ────────────────────────────────────────────────────────

export const teamMessages = {
  list: async (
    businessId: string,
    query: TeamMessagesQuery = {}
  ): Promise<{ data: TeamMessage[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/team/messages${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<TeamMessage[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  send: (businessId: string, input: SendTeamMessageInput): Promise<TeamMessage> =>
    protectedRequest<TeamMessage>('POST', '/team/messages', businessId, input),
};

// ─── Socket auth headers ──────────────────────────────────────────────────────

export const SOCKET_BASE_URL = BASE_URL.replace(/\/api$/, '');

export async function getSocketAuthHeaders(
  accessToken: string,
  businessId: string
): Promise<Record<string, string>> {
  const { token: clientToken } = await getClientToken();
  const timestamp = Date.now().toString();
  const canonical = buildCanonicalString('GET', '/chat', timestamp, '');
  const signature = await hmacSha256Hex(canonical, clientToken);

  return {
    'x-business-id': businessId,
    'x-client-token': clientToken,
    'x-timestamp': timestamp,
    'x-signature': signature,
    Authorization: `Bearer ${accessToken}`,
  };
}

// ─── Announcements types ─────────────────────────────────────────────────────

export interface Announcement {
  _id: string;
  businessId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementsQuery {
  page?: number;
  limit?: number;
}

export interface CreateAnnouncementInput {
  title: string;
  description: string;
}

// ─── Announcements API ────────────────────────────────────────────────────────

export const announcements = {
  list: async (
    businessId: string,
    query: AnnouncementsQuery = {}
  ): Promise<{ data: Announcement[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/team/announcements${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Announcement[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  create: (businessId: string, input: CreateAnnouncementInput): Promise<Announcement> =>
    protectedRequest<Announcement>('POST', '/team/announcements', businessId, input),
};

// ─── Files types ─────────────────────────────────────────────────────────────

export type ClientFileFormat = 'pdf' | 'doc' | 'docx' | 'png' | 'jpg';

export interface ClientFile {
  _id: string;
  businessId: string;
  clientId: string;
  filename: string;
  url: string;
  format: ClientFileFormat;
  filesizeBytes: number;
  uploadedBy?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFileResult {
  url: string;
  publicId: string;
  filename: string;
  mimeType: string;
  filesizeBytes: number;
}

export interface AttachClientFileInput {
  url: string;
  publicId: string;
  filename: string;
  mimeType: string;
  filesizeBytes: number;
}

// ─── Files helpers ────────────────────────────────────────────────────────────

async function protectedMultipartUpload<T>(
  path: string,
  businessId: string,
  formData: FormData
): Promise<T> {
  const token = await resolveToken();
  const url = `${BASE_URL}${path}`;

  const { token: clientToken } = await getClientToken();
  const timestamp = Date.now().toString();
  const canonical = buildCanonicalString('POST', buildPathWithQuery(url), timestamp, '');
  const signature = await hmacSha256Hex(canonical, clientToken);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'x-business-id': businessId,
        'x-client-token': clientToken,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
    });

    if (!response.ok) {
      let apiMessage: string | undefined;
      try {
        const body = (await response.json()) as Record<string, unknown>;
        const msg = body.message;
        if (typeof msg === 'string' && msg.trim()) apiMessage = msg;
      } catch {}
      throw new HttpError(response.status, response.statusText, apiMessage);
    }

    const envelope = (await response.json()) as { data: T };
    return envelope.data;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new RequestTimeoutError();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Files API ────────────────────────────────────────────────────────────────

export const files = {
  upload: (businessId: string, file: File): Promise<UploadedFileResult> => {
    const form = new FormData();
    form.append('file', file);
    return protectedMultipartUpload<UploadedFileResult>('/files/upload', businessId, form);
  },

  listByClient: async (businessId: string, clientId: string): Promise<ClientFile[]> => {
    const envelope = await protectedGet<ClientFile[]>(`/clients/${clientId}/files`, businessId);
    return envelope.data;
  },

  attachToClient: (
    businessId: string,
    clientId: string,
    input: AttachClientFileInput
  ): Promise<ClientFile> =>
    protectedRequest<ClientFile>('POST', `/clients/${clientId}/files`, businessId, input),

  get: async (businessId: string, fileId: string): Promise<{ url: string }> => {
    const envelope = await protectedGet<{ url: string }>(`/files/${fileId}`, businessId);
    return envelope.data;
  },

  delete: (businessId: string, fileId: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/files/${fileId}`, businessId),
};

// ─── Activity Logs API ────────────────────────────────────────────────────────

export const activityLogs = {
  list: async (
    businessId: string,
    query: ActivityLogsQuery = {}
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
