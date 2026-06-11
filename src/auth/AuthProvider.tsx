import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseClient } from "../shared/api/supabase-client";
import { getSupabaseConfigurationError, isSupabaseMode as readSupabaseMode } from "../shared/config/env";
import type { Membership, Profile } from "../shared/types/core";

interface AuthContextValue {
  isSupabaseMode: boolean;
  isLoading: boolean;
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  memberships: Membership[];
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);

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
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setIsLoading(false);
      })
      .catch((error) => {
        console.warn("[auth] sessão indisponível:", error);
        if (mounted) setIsLoading(false);
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

  useEffect(() => {
    if (!isSupabaseMode || !session?.user?.id) {
      setProfile(null);
      setMemberships([]);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setProfile(null);
      setMemberships([]);
      return;
    }

    const userId = session.user.id;
    let mounted = true;
    async function loadAccountContext() {
      const [profileResult, membershipsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("memberships").select("*").eq("profile_id", userId).order("created_at"),
      ]);

      if (!mounted) return;

      if (profileResult.error) {
        console.warn("[auth] profile indisponível:", profileResult.error);
        setProfile(null);
      } else {
        const row = profileResult.data;
        setProfile(row ? {
          id: row.id,
          email: row.email,
          name: row.name ?? row.email,
          avatarUrl: row.avatar_url ?? null,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        } : null);
      }

      if (membershipsResult.error) {
        console.warn("[auth] memberships indisponíveis:", membershipsResult.error);
        setMemberships([]);
      } else {
        setMemberships((membershipsResult.data ?? []).map((row) => ({
          id: row.id,
          organizationId: row.organization_id,
          profileId: row.profile_id,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })));
      }
    }

    loadAccountContext().catch((error) => {
      console.warn("[auth] contexto de conta indisponível:", error);
    });

    return () => {
      mounted = false;
    };
  }, [isSupabaseMode, session?.user?.id]);

  const value = useMemo<AuthContextValue>(() => ({
    isSupabaseMode,
    isLoading,
    session,
    user: session?.user ?? null,
    profile,
    memberships,
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
  }), [configurationError, isLoading, isSupabaseMode, memberships, profile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }
  return context;
}
