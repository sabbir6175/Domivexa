"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { useAuth } from "@/components/auth/auth-provider";
import { MaterialIcon } from "@/components/marketing/material-icon";

function LoadingPanel({ message }: { message: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="flex items-center gap-3 rounded-2xl border border-[#e5ece6] bg-white px-6 py-5 text-sm text-[#68766d] shadow-sm">
        <MaterialIcon name="progress_activity" className="animate-spin text-xl text-[#176b4d]" />
        {message}
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { status, user, accountRole, backendRoleLoading, backendSyncError } = useAuth();

  useEffect(() => {
    if (status === "signed-out") {
      router.replace("/sign-in");
    } else if (status === "authenticated" && !user?.emailVerified) {
      router.replace("/sign-in");
    } else if (status === "authenticated" && !backendRoleLoading && accountRole === "customer") {
      router.replace("/dashboard");
    }
  }, [status, user, backendRoleLoading, accountRole, router]);

  if (status === "loading" || (status === "authenticated" && backendRoleLoading)) {
    return <LoadingPanel message="Verifying your account role..." />;
  }

  if (status === "signed-out" || (status === "authenticated" && accountRole === "customer")) {
    return <LoadingPanel message="Opening your dashboard..." />;
  }

  if (status === "error" || !user || accountRole !== "admin") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
        <section className="w-full max-w-lg rounded-3xl border border-[#e5ece6] bg-white p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4e5] text-2xl text-[#9a6a20]">
            <MaterialIcon name="admin_panel_settings" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold text-[#1d3024]">
            Could not verify administrator access
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#68766d]">
            {backendSyncError ||
              (status === "error"
                ? "Firebase authentication could not be verified. Please sign in again."
                : "Your account role could not be loaded from the server. No administrator access was granted.")}
          </p>
        </section>
      </main>
    );
  }

  return <AdminDashboard currentUid={user.uid} />;
}
