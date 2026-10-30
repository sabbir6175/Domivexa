import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionClaims, getAccountRole } from "@/lib/server-auth";

export async function CustomerRouteGuard({ children }: { children: ReactNode }) {
  const claims = await getSessionClaims();

  if (!claims?.email_verified) redirect("/sign-in");
  const role = await getAccountRole(claims.uid);
  if (role === "admin") redirect("/admin");
  if (role !== "customer") redirect("/sign-in");

  return children;
}
