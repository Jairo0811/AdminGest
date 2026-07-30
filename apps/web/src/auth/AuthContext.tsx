import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api } from '../api/client';

export interface SessionUser {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  company: {
    name: string;
    currency: string;
    timezone: string;
  };
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

  const logout = useCallback(() => {
    localStorage.removeItem('admingest_token');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admingest_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api<SessionUser>('/auth/me')
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener('admingest:unauthorized', logout);
    return () => window.removeEventListener('admingest:unauthorized', logout);
  }, [logout]);

  const establishSession = (session: SessionResponse) => {
    localStorage.setItem('admingest_token', session.accessToken);
    setUser(session.user);
  };

  const value: AuthContextValue = {
    user,
    loading,
    logout,
    async login(email, password) {
      establishSession(
        await api<SessionResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }),
      );
    },
    async register(data) {
      establishSession(
        await api<SessionResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      );
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
