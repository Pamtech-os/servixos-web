import type { ApiErrorCode } from '@/common/network/http-client';

type ApiErrorListener = () => void;

const _listeners = new Map<ApiErrorCode, Set<ApiErrorListener>>();

// Lets app-level providers react to coded API errors (e.g. open the payment step on
// PAYMENT_METHOD_REQUIRED) without every call site having to handle them.
export const apiEvents = {
  emit(code: ApiErrorCode): void {
    _listeners.get(code)?.forEach((fn) => fn());
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
