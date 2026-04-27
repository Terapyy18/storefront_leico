import { supabase } from '@/services/supabaseClient';
import type { AuthContextType } from '@/types';
import { clearSession, getStoredSession, saveSession } from '@/utils/storage';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useEffect, useState } from 'react';

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // true tant que la session initiale n'est pas restaurée depuis le storage
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // 1. Restauration instantanée depuis AsyncStorage
      const stored = await getStoredSession();
      if (isMounted && stored) {
        setSession(stored);
        setUser(stored.user);
      }

      // 2. Rafraîchissement en arrière-plan pour valider / renouveler le token
      const { data: { session: refreshed } } = await supabase.auth.refreshSession();
      if (isMounted) {
        setSession(refreshed);
        setUser(refreshed?.user ?? null);
        if (refreshed) {
          await saveSession(refreshed);
        } else {
          await clearSession();
        }
      }

      if (isMounted) setLoading(false);
    };

    init();

    // 3. Écouter les changements d'état (login, logout, token refresh…)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        saveSession(session);
      } else {
        clearSession();
      }
    });

    // Cleanup du listener au unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>

    
  );
}
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};