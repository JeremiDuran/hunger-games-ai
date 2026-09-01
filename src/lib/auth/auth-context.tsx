"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Enums } from "@/types/database";

export type UserProfile = Tables<"profiles">;
export type UserRole = Enums<"user_role">;

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isPermanent: boolean;
  role: UserRole;
  tokensBalance: number;
  username: string;
  signInAnonymously: () => Promise<{ success: boolean; error?: string }>;
  signInWithPassword: (params: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (params: {
    email: string;
    password: string;
    username?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  upgradeGuestAccount: (params: {
    email: string;
    password: string;
    username?: string;
  }) => Promise<{ success: boolean; error?: string; isConflict?: boolean }>;
  resendVerificationEmail: (email?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.warn("[Auth] Failed to load profile:", error.message);
          return null;
        }

        if (data) {
          setProfile(data);
          return data;
        }
      } catch (err) {
        console.warn("[Auth] Profile fetch exception:", err);
      }
      return null;
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Check
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.warn("[Auth] Error initializing session:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // 2. Auth State Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // Anonymous Sign-In (Guest Tier)
  const signInAnonymously = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in anonymously";
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchProfile]);

  // Standard Email/Password Sign-In
  const signInWithPassword = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser(data.user);
          await fetchProfile(data.user.id);
        }
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Authentication error";
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, fetchProfile]
  );

  // Standard Sign-Up (Permanent Account)
  const signUpWithPassword = useCallback(
    async ({
      email,
      password,
      username,
    }: {
      email: string;
      password: string;
      username?: string;
    }) => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split("@")[0],
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser(data.user);
          await fetchProfile(data.user.id);
        }
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Sign up error";
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, fetchProfile]
  );

  // Progress Preservation: Link Guest Account to Permanent Credentials
  const upgradeGuestAccount = useCallback(
    async ({
      email,
      password,
      username,
    }: {
      email: string;
      password: string;
      username?: string;
    }) => {
      try {
        setIsLoading(true);
        const cleanUsername = username?.trim() || email.split("@")[0];

        // Identity Linking directly on existing anonymous UUID
        const { data, error } = await supabase.auth.updateUser({
          email,
          password,
          data: {
            username: cleanUsername,
          },
        });

        if (error) {
          // Check for collision (email already exists)
          const isConflict =
            error.message.toLowerCase().includes("already registered") ||
            error.status === 422;
          return { success: false, error: error.message, isConflict };
        }

        if (data.user) {
          setUser(data.user);

          // Update profile row with chosen username
          if (cleanUsername) {
            await supabase
              .from("profiles")
              .update({ username: cleanUsername })
              .eq("id", data.user.id);
          }

          await fetchProfile(data.user.id);
        }

        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to upgrade guest account";
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, fetchProfile]
  );

  // Resend Email Verification Dispatch
  const resendVerificationEmail = useCallback(
    async (targetEmail?: string) => {
      try {
        const emailToSend = targetEmail || user?.email;
        if (!emailToSend) {
          return { success: false, error: "No email address found" };
        }
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: emailToSend,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to resend verification dispatch";
        return { success: false, error: msg };
      }
    },
    [supabase, user]
  );

  // Sign Out
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.warn("[Auth] Sign out error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const isAuthenticated = user !== null;
  const isAnonymous = user?.is_anonymous ?? true;
  const isPermanent = Boolean(user && !user.is_anonymous);
  const role: UserRole = profile?.role ?? "user";
  const tokensBalance = profile?.tokens_balance ?? 50;
  const username =
    profile?.username ||
    (user?.user_metadata?.username as string) ||
    (isAnonymous ? "Guest Gamemaker" : "Capitol Citizen");

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated,
      isAnonymous,
      isPermanent,
      role,
      tokensBalance,
      username,
      signInAnonymously,
      signInWithPassword,
      signUpWithPassword,
      upgradeGuestAccount,
      resendVerificationEmail,
      signOut,
      refreshProfile,
    }),
    [
      user,
      profile,
      isLoading,
      isAuthenticated,
      isAnonymous,
      isPermanent,
      role,
      tokensBalance,
      username,
      signInAnonymously,
      signInWithPassword,
      signUpWithPassword,
      upgradeGuestAccount,
      resendVerificationEmail,
      signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
