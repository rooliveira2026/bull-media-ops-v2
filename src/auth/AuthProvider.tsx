import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseClient } from "../shared/api/supabase-client";
import { getSupabaseConfigurationError, isSupabaseMode as readSupabaseMode } from "../shared/config/env";

interface AuthContextValue {
  isSupabaseMode: boolean;
  isLoading: boolean;
  session: Session | null;
  user: SupabaseUser | null;
  configurationError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isSupabaseMode = readSupabaseMode();
  const configurationError = getSupabaseConfigurationError();
  const [isLoading, setIsLoading] = useState(isSupabaseMode);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseMode) {
      setIsLoading(false);
      return undefined;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [isSupabaseMode]);

  const value = useMemo<AuthContextValue>(() => ({
    isSupabaseMode,
    isLoading,
    session,
    user: session?.user ?? null,
    configurationError,
    async signIn(email, password) {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "Supabase não está configurado." };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    async signOut() {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      await supabase.auth.signOut();
    },
  }), [configurationError, isLoading, isSupabaseMode, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
}
