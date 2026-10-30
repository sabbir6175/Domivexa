import { Suspense, type ReactNode } from "react";
import { AdminRouteGuard } from "@/components/auth/admin-route-guard";

function LoadingAdmin() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center text-sm text-[#68766d]">
      Verifying administrator access...
    </main>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingAdmin />}>
      <AdminRouteGuard>{children}</AdminRouteGuard>
    </Suspense>
  );
}
