"use client";

import type { User } from "firebase/auth";

export type AccountRole = "customer" | "admin";

export async function syncBackendUser(
  user: User,
  forceTokenRefresh = false,
): Promise<AccountRole> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL must be configured for the Express API.");
  }

  const response = await fetch(`${apiUrl}/api/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await user.getIdToken(forceTokenRefresh)}`,
    },
    cache: "no-store",
  });

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      result &&
      typeof result === "object" &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "The account could not be synchronized with the backend.";
    throw new Error(message);
  }

  if (
    !result ||
    typeof result !== "object" ||
    !("user" in result) ||
    !result.user ||
    typeof result.user !== "object" ||
    !("role" in result.user) ||
    (result.user.role !== "customer" && result.user.role !== "admin")
  ) {
    throw new Error("The backend returned an invalid account role.");
  }

  return result.user.role;
}
