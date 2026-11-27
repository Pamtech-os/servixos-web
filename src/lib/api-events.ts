import type { ApiErrorCode } from '@/common/network/http-client';

/** Receives the error that carried the code, e.g. to read its `details`. */
type ApiErrorListener = (error: unknown) => void;

const _listeners = new Map<ApiErrorCode, Set<ApiErrorListener>>();

// Lets app-level providers react to coded API errors (e.g. open the payment step on
// PAYMENT_METHOD_REQUIRED) without every call site having to handle them.
export const apiEvents = {
  emit(code: ApiErrorCode, error?: unknown): void {
    _listeners.get(code)?.forEach((fn) => fn(error));
  },

  on(code: ApiErrorCode, fn: ApiErrorListener): () => void {
    let set = _listeners.get(code);
    if (!set) {
      set = new Set();
      _listeners.set(code, set);
    }
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  },
};
