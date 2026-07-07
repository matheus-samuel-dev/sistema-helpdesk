import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_BASE_URL, api } from './api';
import { clearStoredAuth, getStoredToken, getStoredUser, persistAuth } from './utils/authStorage';
import { createDemoSession, isDemoCredentials, isDemoToken } from './demo/demoApi';
import type { User } from './types';

type AuthValue = {
  user: User | null;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const value = useMemo(
    () => ({
      user,
      login: async (email: string, password: string, remember: boolean) => {
        if (isDemoCredentials(email, password)) {
          const data = createDemoSession();
          persistAuth(data, remember);
          setUser(data.user);
          console.info('[HelpDesk] Login demo local ativado.', {
            apiUrl: API_BASE_URL,
            status: 'offline-demo',
            cause: 'Credenciais demo/admin usadas; login nao bloqueia cold start do backend.',
          });
          return;
        }

        const { data } = await api.post('/auth/login', { email, password });
        if (!data?.token || !data?.user) {
          throw new Error('Resposta de login inválida.');
        }
        persistAuth({ token: data.token, user: data.user }, remember);
        setUser(data.user);
      },
      logout: () => {
        if (!isDemoToken(getStoredToken())) {
          api.post('/auth/logout').catch(() => undefined);
        }
        clearStoredAuth();
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('AuthProvider ausente.');
  }
  return context;
};

export function Protected({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
}
