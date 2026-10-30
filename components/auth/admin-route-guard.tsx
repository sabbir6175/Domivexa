import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionClaims, getAccountRole } from "@/lib/server-auth";

export async function AdminRouteGuard({ children }: { children: ReactNode }) {
  const claims = await getSessionClaims();

  if (!claims?.email_verified) redirect("/admin-login");
  const role = await getAccountRole(claims.uid);
  if (role !== "admin") redirect("/dashboard");

  return children;
}
