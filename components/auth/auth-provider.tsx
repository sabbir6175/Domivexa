"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  clearServerSession,
  establishServerSession,
} from "@/lib/auth-session";

type AuthState =
  | { status: "loading"; user: null; error: null }
  | { status: "signed-out"; user: null; error: null }
  | { status: "authenticated"; user: User; error: null }
  | { status: "error"; user: null; error: unknown };

type AuthContextValue = AuthState & {
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    let authEvent = 0;
    let hadAuthenticatedUser = false;
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve()
      .then(() => getFirebaseAuth())
      .then((auth) => {
        if (!active) return;

        unsubscribe = onIdTokenChanged(
          auth,
          async (user) => {
            const event = ++authEvent;
            try {
              if (user) {
                hadAuthenticatedUser = true;
                await establishServerSession(user);
              } else if (hadAuthenticatedUser) {
                await clearServerSession();
                hadAuthenticatedUser = false;
              }

              if (!active || event !== authEvent) return;
              setState(
                user
                  ? { status: "authenticated", user, error: null }
                  : { status: "signed-out", user: null, error: null },
              );
            } catch (error) {
              console.error("Could not synchronize Firebase authentication with the server session:", error);
              if (!active || event !== authEvent) return;
              setState({ status: "error", user: null, error });
            }
          },
          (error) => {
            if (!active) return;
            console.error("Could not observe Firebase authentication:", error);
            setState({ status: "error", user: null, error });
          },
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Could not initialize Firebase authentication:", error);
        setState({ status: "error", user: null, error });
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    if (state.status !== "authenticated") return;
    await state.user.reload();
    await establishServerSession(state.user);
    setState({ status: "authenticated", user: state.user, error: null });
  }, [state]);

  const value = useMemo(
    () => ({ ...state, refreshUser }),
    [state, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
