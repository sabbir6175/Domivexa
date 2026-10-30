"use client";

import { signOut, type Auth, type User } from "firebase/auth";

export class AuthSessionError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AuthSessionError";
  }
}

export async function createServerSession(idToken: string, adminOnly = false) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ idToken, adminOnly }),
  });

  if (!response.ok) {
    throw new AuthSessionError(
      "The secure sign-in session could not be created.",
      response.status,
    );
  }

  const result: unknown = await response.json();
  if (
    !result ||
    typeof result !== "object" ||
    !("isAdmin" in result) ||
    typeof result.isAdmin !== "boolean"
  ) {
    throw new AuthSessionError("The server returned an invalid session response.");
  }

  return { isAdmin: result.isAdmin };
}

export async function establishServerSession(user: User) {
  if (!user.emailVerified) return;
  await createServerSession(await user.getIdToken());
}

export async function clearServerSession() {
  const response = await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AuthSessionError("The secure sign-in session could not be cleared.");
  }
}

export async function signOutAndClearSession(auth: Auth) {
  await clearServerSession();
  await signOut(auth);
}
