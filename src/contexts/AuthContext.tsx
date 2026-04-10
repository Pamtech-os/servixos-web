import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  isPinVerified: boolean;
  userEmail: string;
}

interface AuthContextType {
  auth: AuthState;
  login: (email: string) => void;
  verifyPin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    isPinVerified: false,
    userEmail: '',
  });

  const login = (email: string) =>
    setAuth({ isLoggedIn: true, isPinVerified: false, userEmail: email });
  const verifyPin = () => setAuth((prev) => ({ ...prev, isPinVerified: true }));
  const logout = () => setAuth({ isLoggedIn: false, isPinVerified: false, userEmail: '' });

  return (
    <AuthContext.Provider value={{ auth, login, verifyPin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
