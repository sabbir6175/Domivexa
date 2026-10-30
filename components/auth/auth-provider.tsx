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
import { syncBackendUser, type AccountRole } from "@/lib/backend-client";

type AuthState =
  | { status: "loading"; user: null; error: null }
  | { status: "signed-out"; user: null; error: null }
  | { status: "authenticated"; user: User; error: null }
  | { status: "error"; user: null; error: unknown };

type AuthContextValue = AuthState & {
  refreshUser: () => Promise<void>;
  backendSyncError: string | null;
  backendRoleLoading: boolean;
  accountRole: AccountRole | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    error: null,
  });
  const [backendSyncError, setBackendSyncError] = useState<string | null>(null);
  const [backendRoleLoading, setBackendRoleLoading] = useState(true);
  const [accountRole, setAccountRole] = useState<AccountRole | null>(null);

  useEffect(() => {
    let active = true;
    let authEvent = 0;
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve()
      .then(() => getFirebaseAuth())
      .then((auth) => {
        if (!active) return;

        unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            const event = ++authEvent;
            setBackendSyncError(null);
            setAccountRole(null);
            setBackendRoleLoading(Boolean(user?.emailVerified));
            setState(
              user
                ? { status: "authenticated", user, error: null }
                : { status: "signed-out", user: null, error: null },
            );

            if (user?.emailVerified) {
              void syncBackendUser(user)
                .then((role) => {
                  if (active && event === authEvent) {
                    setAccountRole(role);
                    setBackendRoleLoading(false);
                  }
                })
                .catch((error: unknown) => {
                  console.error("Could not synchronize the account with the Express backend:", error);
                  if (active && event === authEvent) {
                    setBackendRoleLoading(false);
                    setBackendSyncError(
                      error instanceof Error
                        ? error.message
                        : "The account could not be synchronized with the backend.",
                    );
                  }
                });
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

    if (state.user.emailVerified) {
      setBackendRoleLoading(true);
      setBackendSyncError(null);
      try {
        const role = await syncBackendUser(state.user);
        setAccountRole(role);
        setBackendSyncError(null);
      } catch (error) {
        console.error("Could not synchronize the account with the Express backend:", error);
        setAccountRole(null);
        setBackendSyncError(
          error instanceof Error
            ? error.message
            : "The account could not be synchronized with the backend.",
        );
      } finally {
        setBackendRoleLoading(false);
      }
    } else {
      setAccountRole(null);
      setBackendRoleLoading(false);
    }

    setState({ status: "authenticated", user: state.user, error: null });
  }, [state]);

  const value = useMemo(
    () => ({
      ...state,
      refreshUser,
      backendSyncError,
      backendRoleLoading,
      accountRole,
    }),
    [state, refreshUser, backendSyncError, backendRoleLoading, accountRole],
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
