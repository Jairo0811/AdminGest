import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  api,
  AUTH_CHANNEL,
  closeSession,
  clearAccessToken,
  restoreSession,
  setAccessToken,
} from '../api/client';

export interface SessionUser {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  company: { name: string; currency: string; timezone: string };
}

interface SessionResponse {
  accessToken: string;
  user: SessionUser;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(data: RegisterData): Promise<void>;
  refreshUser(): Promise<void>;
  logout(): void;
}

export interface RegisterData {
  companyName: string;
  taxId?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  /** Drops the session locally: token, user and every cached query of the tenant. */
  const forgetSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const logout = useCallback(() => {
    forgetSession();
    void closeSession();
    try {
      const channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.postMessage('logout');
      channel.close();
    } catch {
      // BroadcastChannel is optional; other tabs will be rejected on their next request.
    }
  }, [forgetSession]);

  const refreshUser = useCallback(async () => {
    setUser(await api<SessionUser>('/auth/me'));
  }, []);

  useEffect(() => {
    // Drop old persistent JWTs; future access tokens live only in memory.
    localStorage.removeItem('admingest_token');
    let cancelled = false;
    restoreSession().then((session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // The server already rejected the session: clear local state without calling
    // /auth/logout, which could revoke a session another tab has just renewed.
    window.addEventListener('admingest:unauthorized', forgetSession);
    return () => window.removeEventListener('admingest:unauthorized', forgetSession);
  }, [forgetSession]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.onmessage = (event) => {
      if (event.data === 'logout') forgetSession();
    };
    return () => channel.close();
  }, [forgetSession]);

  const establishSession = (session: SessionResponse) => {
    // Never show data cached for a previous user or company.
    queryClient.clear();
    setAccessToken(session.accessToken);
    setUser(session.user);
  };

  const value: AuthContextValue = {
    user, loading, logout, refreshUser,
    async login(email, password) {
      establishSession(await api<SessionResponse>('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }));
    },
    async register(data) {
      establishSession(await api<SessionResponse>('/auth/register', {
        method: 'POST', body: JSON.stringify(data),
      }));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  return value;
}
