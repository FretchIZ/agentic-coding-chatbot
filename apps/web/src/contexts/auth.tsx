'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, initAuth, type FirebaseUser } from '@/lib/firebase';

interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const unsub = onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    initAuth();
    return unsub;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
