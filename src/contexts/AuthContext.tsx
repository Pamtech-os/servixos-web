'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';

// On the server useLayoutEffect doesn't exist; fall back to useEffect so SSR doesn't warn.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import {
  auth as authApi,
  decodeJwt,
  type SessionData,
  type SessionUser,
} from '@/lib/api-client';
import { tokenStore } from '@/lib/token-store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  isLoggedIn: boolean;
  isPinVerified: boolean;
  userEmail: string;
  userRole: 'owner' | 'employee' | 'client' | null;
  user: SessionUser | null;
}

interface AuthContextType {
  auth: AuthState;
  isHydrated: boolean;
  setSession: (data: SessionData) => void;
  completeVerification: () => void;
  completeSetup: () => void;
  logout: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = 'servixos-auth-state';

const EMPTY_AUTH_STATE: AuthState = {
  isLoggedIn: false,
  isPinVerified: false,
  userEmail: '',
  userRole: null,
  user: null,
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(EMPTY_AUTH_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Synchronous fast path: reads sessionStorage before the first paint so logged-in
  // users never see the skeleton flash. Falls back to useEffect on the server.
  useIsomorphicLayoutEffect(() => {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) { setIsHydrated(true); return; }

    let persisted: Partial<AuthState> | null = null;
    try { persisted = JSON.parse(raw) as Partial<AuthState>; } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      setIsHydrated(true);
      return;
    }

    if (!persisted?.isLoggedIn) { setIsHydrated(true); return; }

    setAuth({
      isLoggedIn: true,
      isPinVerified: persisted.isPinVerified ?? false,
      userEmail: persisted.userEmail ?? '',
      userRole: persisted.userRole ?? null,
      user: persisted.user ?? null,
    });
    setIsHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wire the session-expired listener. When a 401 survives a refresh attempt,
  // the 401 interceptor in core.ts calls tokenStore.notifyExpired() which triggers this.
  useEffect(() => {
    const unsubExpired = tokenStore.onSessionExpired(() => {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      setAuth(EMPTY_AUTH_STATE);
      authApi.logout();
    });

    return () => unsubExpired();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist auth state to sessionStorage on every change.
  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, [auth, isHydrated]);

  const setSession = useCallback((data: SessionData) => {
    // Decode metadata from the body token (still returned by server for mobile compatibility).
    // We read pinVerified and userRole from it but never store the token itself.
    const { pinVerified, userRole } = (() => {
      try {
        const decoded = decodeJwt(data.accessToken);
        return { pinVerified: decoded.pinVerified, userRole: decoded.userRole };
      } catch {
        return { pinVerified: false, userRole: 'owner' as const };
      }
    })();

    setAuth({
      isLoggedIn: true,
      isPinVerified: pinVerified,
      userEmail: data.user.email,
      userRole,
      user: data.user,
    });
  }, []);

  // Called after a successful verify-pin — cookie is replaced by server automatically.
  const completeVerification = useCallback(() => {
    setAuth((prev) => ({ ...prev, isPinVerified: true }));
  }, []);

  // Called after a successful complete-setup — cookie is replaced by server automatically.
  const completeSetup = useCallback(() => {
    setAuth((prev) => ({
      ...prev,
      isPinVerified: true,
      user: prev.user ? { ...prev.user, mustChangePassword: false } : prev.user,
    }));
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(EMPTY_AUTH_STATE);
    authApi.logout(); // server clears access_token and refresh_token cookies
  }, []);

  const value = useMemo(
    () => ({ auth, isHydrated, setSession, completeVerification, completeSetup, logout }),
    [auth, isHydrated, setSession, completeVerification, completeSetup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
