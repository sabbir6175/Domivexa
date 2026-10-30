import { Suspense, type ReactNode } from "react";
import { CustomerRouteGuard } from "@/components/auth/customer-route-guard";

function LoadingDashboard() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center text-sm text-[#68766d]">
      Verifying your account...
    </main>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingDashboard />}>
      <CustomerRouteGuard>{children}</CustomerRouteGuard>
    </Suspense>
  );
}
