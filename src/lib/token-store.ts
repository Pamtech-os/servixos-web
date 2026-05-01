type TokenRefreshListener = (accessToken: string) => void;

const REFRESH_KEY = 'servixos_rt';

let _accessToken: string | null = null;
const _listeners: TokenRefreshListener[] = [];

export const tokenStore = {
  getAccessToken(): string | null {
    return _accessToken;
  },

  setAccessToken(token: string): void {
    _accessToken = token;
    _listeners.forEach((fn) => fn(token));
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
    _listeners.push(fn);
    return () => {
      const i = _listeners.indexOf(fn);
      if (i !== -1) _listeners.splice(i, 1);
    };
  },
};
