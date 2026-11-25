import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CreateAccountInput, LoginInput, StoreUser } from '../api/types';
import { api } from '../api';

type AuthContextValue = {
  user: StoreUser | null;
  ready: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  createAccount: (input: CreateAccountInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const seedDemoSession = async () => {
      try {
        const current = await api.getCurrentUser();
        if (current) {
          if (active) setUser(current);
        } else if (!import.meta.env.VITE_API_BASE_URL) {
          const seeded = await api.login({ phone: '+91 98765 43210', password: 'demo-password' });
          if (active) setUser(seeded);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    };
    void seedDemoSession();
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (input: LoginInput) => {
    const signedIn = await api.login(input);
    setUser(signedIn);
  }, []);

  const createAccount = useCallback(async (input: CreateAccountInput) => {
    const created = await api.createAccount(input);
    setUser(created);
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, createAccount, signOut }), [
    user, ready, signIn, createAccount, signOut,
  ]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
