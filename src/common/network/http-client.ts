export class NetworkOfflineError extends Error {
  constructor(message = 'You appear to be offline. Please check your internet connection.') {
    super(message);
    this.name = 'NetworkOfflineError';
  }
}

export class RequestTimeoutError extends Error {
  constructor(message = 'The request timed out. Please try again.') {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

export class HttpError extends Error {
  status: number;
  statusText: string;
  body: unknown;

  constructor(status: number, statusText: string, message?: string, body?: unknown) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

function extractApiMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const record = payload as Record<string, unknown>;
  const direct = record.message;
  if (typeof direct === 'string' && direct.trim()) return direct;

  // Some 403s (e.g. SUBSCRIPTION_REQUIRED) nest a structured object under `message`.
  if (direct && typeof direct === 'object') {
    const nestedMessage = (direct as Record<string, unknown>).message;
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
  }

  const nestedError = record.error;
  if (typeof nestedError === 'string' && nestedError.trim()) return nestedError;
  if (nestedError && typeof nestedError === 'object') {
    const nestedRecord = nestedError as Record<string, unknown>;
    if (typeof nestedRecord.message === 'string' && nestedRecord.message.trim()) {
      return nestedRecord.message;
    }
  }

  const errors = record.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (first && typeof first === 'object') {
      const firstRecord = first as Record<string, unknown>;
      if (typeof firstRecord.message === 'string' && firstRecord.message.trim()) {
        return firstRecord.message;
      }
    }
  }

  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (error instanceof HttpError) {
    if (error.message && !error.message.startsWith('Request failed with status')) {
      return error.message;
    }
    return fallback;
  }

  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;

  if (error && typeof error === 'object') {
    const message = extractApiMessage(error);
    if (message) return message;
  }

  return fallback;
}

export interface SubscriptionRequiredInfo {
  currentPlan: string;
  requiredPlan: string;
  upgradeUrl: string;
  message: string;
}

export function getSubscriptionRequiredInfo(error: unknown): SubscriptionRequiredInfo | null {
  if (!(error instanceof HttpError) || error.status !== 403) return null;
  if (!error.body || typeof error.body !== 'object') return null;

  const message = (error.body as Record<string, unknown>).message;
  if (!message || typeof message !== 'object') return null;

  const info = message as Record<string, unknown>;
  if (info.code !== 'SUBSCRIPTION_REQUIRED') return null;

  return {
    currentPlan: typeof info.currentPlan === 'string' ? info.currentPlan : '',
    requiredPlan: typeof info.requiredPlan === 'string' ? info.requiredPlan : '',
    upgradeUrl: typeof info.upgradeUrl === 'string' ? info.upgradeUrl : '',
    message: typeof info.message === 'string' ? info.message : '',
  };
}

type JsonRequestOptions = {
  timeoutMs?: number;
};

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: JsonRequestOptions = {}
): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new NetworkOfflineError();
  }

  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-channel': 'web',
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      let apiMessage: string | undefined;
      let body: unknown;
      try {
        body = (await response.json()) as unknown;
        apiMessage = extractApiMessage(body);
      } catch {
        // response body wasn't JSON — fall back to generic message
      }
      throw new HttpError(response.status, response.statusText, apiMessage, body);
    }

    return (await response.json()) as T;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new RequestTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
