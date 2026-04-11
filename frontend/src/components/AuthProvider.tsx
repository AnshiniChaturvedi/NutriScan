'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getCurrentUser, signIn, signOut, signUp } from '@/lib/auth';
import type { AuthSession, AuthUser, LoginRequest, SignupRequest } from '@/lib/types';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  login: (payload: LoginRequest) => Promise<AuthSession>;
  register: (payload: SignupRequest) => Promise<AuthSession>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setLoading(false);
    return currentUser;
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginRequest) => {
    const session = await signIn(payload);
    setUser(session.user);
    return session;
  }, []);

  const register = useCallback(async (payload: SignupRequest) => {
    const session = await signUp(payload);
    setUser(session.user);
    return session;
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refreshUser, login, register, logout }),
    [user, loading, refreshUser, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}