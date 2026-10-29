import Link from "next/link";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { MaterialIcon } from "@/components/marketing/material-icon";

export const metadata = {
  title: "Reset password | Domivexa",
  description: "Request a password reset email for your Domivexa account.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="register-scene relative isolate flex min-h-[65vh] items-center overflow-hidden px-4 py-12 text-[#172b22] sm:px-8 sm:py-16">
      <section className="register-glass-card relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#c4e7ca]/40 blur-3xl" />
        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf4eb] text-[#218259]">
            <MaterialIcon name="lock_reset" className="text-2xl" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#25865e]">
            Account recovery
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em] text-[#172b22]">
            Reset your password.
          </h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-[#59685e]">
            Enter your account email and Firebase will send a secure reset link.
          </p>
          <PasswordResetForm />
          <p className="mt-6 text-center text-xs text-[#718078]">
            <Link href="/register" className="font-semibold text-[#176b4d] hover:underline">
              Need an account? Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
