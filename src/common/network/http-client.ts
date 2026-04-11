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

  constructor(status: number, statusText: string, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
  }
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
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new HttpError(response.status, response.statusText);
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
