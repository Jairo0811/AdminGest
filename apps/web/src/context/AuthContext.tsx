import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, sessionKey } from '../lib/api';
import { AuthSession } from '../types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  companyName: string;
  taxId?: string;
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): AuthSession | null {
  const raw = localStorage.getItem(sessionKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(sessionKey);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(loadSession);

  const persist = useCallback((next: AuthSession | null) => {
    setSession(next);
    if (next) localStorage.setItem(sessionKey, JSON.stringify(next));
    else localStorage.removeItem(sessionKey);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    persist(await api<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify(input) }));
  }, [persist]);

  const register = useCallback(async (input: RegisterInput) => {
    persist(
      await api<AuthSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  useEffect(() => {
    window.addEventListener('admingest:unauthorized', logout);
    return () => window.removeEventListener('admingest:unauthorized', logout);
  }, [logout]);

  const value = useMemo(() => ({ session, login, register, logout }), [
    session,
    login,
    register,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// El hook comparte el contexto con el proveedor en este módulo de infraestructura.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  return context;
}
