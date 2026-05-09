import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import {
  auth as authApi,
  decodeJwt,
  isTokenExpired,
  type SessionData,
  type SessionUser,
} from '@/lib/api-client';
import { tokenStore } from '@/lib/token-store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  isLoggedIn: boolean;
  isPinVerified: boolean;
  userEmail: string;
  accessToken: string | null;
  user: SessionUser | null;
}

interface AuthContextType {
  auth: AuthState;
  isHydrated: boolean;
  setSession: (data: SessionData) => void;
  completeVerification: (accessToken: string) => void;
  logout: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// Both keys live in sessionStorage — cleared automatically when the tab closes.
const AUTH_STORAGE_KEY = 'servixos-auth-state';

const EMPTY_AUTH_STATE: AuthState = {
  isLoggedIn: false,
  isPinVerified: false,
  userEmail: '',
  accessToken: null,
  user: null,
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(EMPTY_AUTH_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function hydrate() {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;

      let persisted: Partial<AuthState> | null = null;
      try { persisted = JSON.parse(raw) as Partial<AuthState>; } catch {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      if (!persisted?.isLoggedIn) return;

      const accessToken = persisted.accessToken ?? null;

      if (!accessToken) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      // Token expired — keep the session alive but require PIN re-verification.
      // The expired token is preserved so the /pin page can still send it.
      if (isTokenExpired(accessToken)) {
        setAuth({
          isLoggedIn: true,
          isPinVerified: false,
          userEmail: persisted.userEmail ?? '',
          accessToken,
          user: persisted.user ?? null,
        });
        return;
      }

      tokenStore.setAccessToken(accessToken);
      setAuth({
        isLoggedIn: true,
        isPinVerified: decodeJwt(accessToken).pinVerified,
        userEmail: persisted.userEmail ?? '',
        accessToken,
        user: persisted.user ?? null,
      });
    }

    void hydrate().finally(() => setIsHydrated(true));

    const unsubRefresh = tokenStore.onAccessTokenRefreshed((token) => {
      setAuth((prev) => ({ ...prev, accessToken: token }));
    });

    const unsubExpired = tokenStore.onSessionExpired(() => {
      setAuth((prev) => ({ ...prev, isPinVerified: false }));
    });

    return () => {
      unsubRefresh();
      unsubExpired();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist auth state to sessionStorage on every change.
  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, [auth, isHydrated]);

  const setSession = useCallback((data: SessionData) => {
    const pinVerified = (() => {
      try { return decodeJwt(data.accessToken).pinVerified; } catch { return false; }
    })();

    tokenStore.setAccessToken(data.accessToken);
    tokenStore.setRefreshToken(data.refreshToken);

    setAuth({
      isLoggedIn: true,
      isPinVerified: pinVerified,
      userEmail: data.user.email,
      accessToken: data.accessToken,
      user: data.user,
    });
  }, []);

  const completeVerification = useCallback((accessToken: string) => {
    tokenStore.setAccessToken(accessToken);
    setAuth((prev) => ({ ...prev, accessToken, isPinVerified: true }));
  }, []);

  const logout = useCallback(() => {
    const refreshToken = tokenStore.getRefreshToken();
    tokenStore.clear();
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(EMPTY_AUTH_STATE);
    if (refreshToken) authApi.logout(refreshToken);
  }, []);

  const value = useMemo(
    () => ({ auth, isHydrated, setSession, completeVerification, logout }),
    [auth, isHydrated, setSession, completeVerification, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
