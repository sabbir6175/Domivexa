import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = {
  title: "Admin login | Domivexa",
  description: "Sign in to the Domivexa administrator console.",
};

export default function AdminLoginPage() {
  return (
    <main className="register-scene relative isolate overflow-hidden px-4 py-6 text-[#172b22] sm:px-8 sm:py-10 lg:min-h-[calc(100vh-72px)] lg:py-12">
      <div className="mx-auto grid max-w-7xl items-center gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(440px,0.96fr)] lg:gap-8">
        <section className="register-visual relative flex min-h-[410px] flex-col justify-between overflow-hidden rounded-[2rem] p-7 text-white shadow-[0_30px_90px_-40px_rgba(6,35,25,0.6)] sm:min-h-[470px] sm:p-10 lg:min-h-[560px] lg:p-10">
          <Link href="/" className="relative z-10 flex items-center gap-3" aria-label="Domivexa home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 font-heading text-xl font-bold backdrop-blur-md">
              D
            </span>
            <span className="font-heading text-xl font-bold tracking-tight">
              Domi<span className="text-[#9fe2b5]">vexa</span>
            </span>
          </Link>

          <div className="register-orbit relative mx-auto my-5 flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56 lg:h-48 lg:w-48" aria-hidden="true">
            <span className="register-orbit__ring register-orbit__ring--outer" />
            <span className="register-orbit__ring register-orbit__ring--middle" />
            <span className="register-orbit__ring register-orbit__ring--inner" />
            <span className="register-orbit__glow" />
            <span className="register-orbit__core">
              <span className="material-symbols-rounded text-4xl text-white sm:text-5xl">admin_panel_settings</span>
            </span>
            <span className="register-orbit__satellite register-orbit__satellite--one">
              <span className="material-symbols-rounded">lock</span>
            </span>
            <span className="register-orbit__satellite register-orbit__satellite--two">
              <span className="material-symbols-rounded">verified_user</span>
            </span>
            <span className="register-orbit__satellite register-orbit__satellite--three">
              <span className="material-symbols-rounded">dashboard</span>
            </span>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#d3edda] backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#a5e7b6]" />
              ADMINISTRATOR ACCESS
            </p>
            <h1 className="font-heading text-3xl font-bold leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              Manage your Domivexa workspace.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/75 sm:text-base">
              Create your administrator account or sign in to open the
              protected console.
            </p>
          </div>
        </section>

        <section className="register-glass-card relative self-center overflow-hidden rounded-[2rem] p-6 sm:p-9 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#c4e7ca]/40 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25865e]">
              Admin console
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em] text-[#172b22]">
              Sign in or create your admin account.
            </h2>
            <p className="mt-3 mb-7 text-sm leading-6 text-[#59685e]">
              Create an account with your configured email, verify it, then sign in.
            </p>
            <SignInForm adminOnly />
          </div>
        </section>
      </div>
    </main>
  );
}
