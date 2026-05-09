type TokenRefreshListener = (accessToken: string) => void;
type SessionExpiredListener = () => void;

const REFRESH_KEY = 'servixos_rt';

let _accessToken: string | null = null;
const _refreshListeners: TokenRefreshListener[] = [];
const _expiredListeners: SessionExpiredListener[] = [];

export const tokenStore = {
  getAccessToken(): string | null {
    return _accessToken;
  },

  setAccessToken(token: string): void {
    _accessToken = token;
    _refreshListeners.forEach((fn) => fn(token));
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(REFRESH_KEY);
  },

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') sessionStorage.setItem(REFRESH_KEY, token);
  },

  clear(): void {
    _accessToken = null;
    if (typeof window !== 'undefined') sessionStorage.removeItem(REFRESH_KEY);
  },

  onAccessTokenRefreshed(fn: TokenRefreshListener): () => void {
    _refreshListeners.push(fn);
    return () => {
      const i = _refreshListeners.indexOf(fn);
      if (i !== -1) _refreshListeners.splice(i, 1);
    };
  },

  notifyExpired(): void {
    _expiredListeners.forEach((fn) => fn());
  },

  onSessionExpired(fn: SessionExpiredListener): () => void {
    _expiredListeners.push(fn);
    return () => {
      const i = _expiredListeners.indexOf(fn);
      if (i !== -1) _expiredListeners.splice(i, 1);
    };
  },
};
