import { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  isPinVerified: boolean;
  userEmail: string;
}

interface AuthContextType {
  auth: AuthState;
  isHydrated: boolean;
  login: (email: string) => void;
  verifyPin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_STORAGE_KEY = 'servixos-auth-state';
const EMPTY_AUTH_STATE: AuthState = {
  isLoggedIn: false,
  isPinVerified: false,
  userEmail: '',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(EMPTY_AUTH_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<AuthState>;
      setAuth({
        isLoggedIn: Boolean(parsed.isLoggedIn),
        isPinVerified: Boolean(parsed.isPinVerified),
        userEmail: typeof parsed.userEmail === 'string' ? parsed.userEmail : '',
      });
    } catch {
      setAuth(EMPTY_AUTH_STATE);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, [auth, isHydrated]);

  const login = useCallback(
    (email: string) => setAuth({ isLoggedIn: true, isPinVerified: false, userEmail: email }),
    []
  );
  const verifyPin = useCallback(() => setAuth((prev) => ({ ...prev, isPinVerified: true })), []);
  const logout = useCallback(
    () => setAuth({ isLoggedIn: false, isPinVerified: false, userEmail: '' }),
    []
  );

  const value = useMemo(
    () => ({
      auth,
      isHydrated,
      login,
      verifyPin,
      logout,
    }),
    [auth, isHydrated, login, logout, verifyPin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
