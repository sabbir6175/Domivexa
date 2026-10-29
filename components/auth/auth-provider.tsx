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
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

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
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve()
      .then(() => getFirebaseAuth())
      .then((auth) => {
        if (!active) return;

        unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            if (!active) return;
            setState(
              user
                ? { status: "authenticated", user, error: null }
                : { status: "signed-out", user: null, error: null },
            );
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
