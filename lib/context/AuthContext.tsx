"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type {
  AuthContextValue,
  AuthUser,
  LoginCredentials,
  LoginResult,
  StoredSession,
} from "@/lib/types";
import * as authService from "@/lib/services/authService";
import { readJson, removeKey, writeJson } from "@/lib/utils/storage";
import { LOGIN_ROUTE, SESSION_STORAGE_KEY } from "@/lib/utils/constants";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const stored = readJson<StoredSession>(SESSION_STORAGE_KEY);

    if (stored?.user) {
      setUser(stored.user);
    }

    setIsRestoring(false);
  }, []);

  const signIn = useCallback(
    async (credentials: LoginCredentials): Promise<LoginResult> => {
      const result = await authService.signIn(credentials);

      if (result.ok) {
        const session: StoredSession = {
          user: result.user,
          signedInAt: new Date().toISOString(),
        };

        writeJson(SESSION_STORAGE_KEY, session);
        setUser(result.user);
      }

      return result;
    },
    []
  );

  const signOut = useCallback(() => {
    removeKey(SESSION_STORAGE_KEY);
    setUser(null);
    router.push(LOGIN_ROUTE);
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isRestoring,
      signIn,
      signOut,
    }),
    [user, isRestoring, signIn, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }

  return context;
}