import "server-only";

import { cookies } from "next/headers";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase-admin";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export type AccountRole = "admin" | "customer" | "unsupported";

export async function getAccountRole(uid: string): Promise<AccountRole> {
  const userDocument = await getFirebaseAdminFirestore()
    .collection("users")
    .doc(uid)
    .get();
  if (!userDocument.exists) return "customer";

  const role = userDocument.get("role");
  if (role === "admin" || role === "customer") return role;
  return "unsupported";
}

export async function getSessionClaims() {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;
    if (
      code === "auth/argument-error" ||
      code === "auth/id-token-expired" ||
      code === "auth/id-token-revoked" ||
      code === "auth/invalid-session-cookie" ||
      code === "auth/session-cookie-expired" ||
      code === "auth/session-cookie-revoked" ||
      code === "auth/user-disabled" ||
      code === "auth/user-not-found"
    ) {
      return null;
    }

    throw error;
  }
}
