import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from './api';
import { clearStoredAuth, getStoredUser, persistAuth } from './utils/authStorage';
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
        const { data } = await api.post('/auth/login', { email, password });
        if (!data?.token || !data?.user) {
          throw new Error('Resposta de login inválida.');
        }
        persistAuth({ token: data.token, user: data.user }, remember);
        setUser(data.user);
      },
      logout: () => {
        api.post('/auth/logout').catch(() => undefined);
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
