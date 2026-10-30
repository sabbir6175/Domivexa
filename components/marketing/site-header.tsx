"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { MaterialIcon } from "@/components/marketing/material-icon";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

const navigation = [
  { label: "Domains", href: "/domains" },
  { label: "Pricing", href: "/pricing" },
  { label: "Transfer", href: "/transfer" },
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");
  const { status, user, accountRole } = useAuth();
  const signedOut = status === "signed-out" || status === "error";
  const dashboardHref = accountRole === "admin" ? "/admin" : "/dashboard";

  async function handleSignOut() {
    setSigningOut(true);
    setAuthError("");

    try {
      await signOut(getFirebaseAuth());
      setProfileOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error("Could not sign out from the site header:", error);
      setAuthError("Sign out could not be completed. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  const profileLabel = user?.displayName?.trim() || user?.email || "Your account";
  const profileInitial = profileLabel.slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8eee8] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Domivexa home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#176b4d] text-xl font-bold text-white shadow-sm shadow-[#176b4d]/20">
            D
          </span>
          <span className="font-heading text-[1.4rem] font-bold tracking-tight">
            Domi<span className="text-[#25865e]">vexa</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-medium text-gray-600 lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-[#176b4d]">
              {item.label}
            </Link>
          ))}
          <Link href="/#services" className="transition-colors hover:text-[#176b4d]">
            Services
          </Link>
          {status === "authenticated" && user && (
            <Link href={dashboardHref} className="transition-colors hover:text-[#176b4d]">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="relative flex items-center gap-3">
          {signedOut && (
            <>
              <Link
                href="/sign-in"
                className="hidden items-center rounded-xl px-3 py-3 text-sm font-semibold text-[#176b4d] transition hover:bg-[#f4f8f2] md:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="glass-button-light hidden items-center gap-1 rounded-xl px-4 py-3 text-sm font-semibold text-[#176b4d] md:inline-flex"
              >
                Create account
              </Link>
            </>
          )}
          {status === "authenticated" && user && (
            <div className="relative">
              <button
                type="button"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setAuthError("");
                }}
                className="glass-button-light flex min-h-11 items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#176b4d] sm:px-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#176b4d] text-xs font-bold text-white">
                  {profileInitial}
                </span>
                <span className="hidden max-w-36 truncate sm:inline">{profileLabel}</span>
                <MaterialIcon name="expand_more" className="text-base" />
              </button>
              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[#e1ebe2] bg-white p-2 shadow-[0_18px_50px_-24px_rgba(18,73,48,0.45)]"
                >
                  <div className="border-b border-[#edf2ed] px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-[#20372a]">{profileLabel}</p>
                    {user.email && user.displayName && (
                      <p className="mt-0.5 truncate text-xs text-[#738078]">{user.email}</p>
                    )}
                  </div>
                  {authError && (
                    <p role="alert" className="px-3 py-2 text-xs leading-5 text-[#8b3c2d]">
                      {authError}
                    </p>
                  )}
                  <Link
                    href={dashboardHref}
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[#344b3b] hover:bg-[#f4f8f2]"
                  >
                    <MaterialIcon name="dashboard" className="text-lg" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={signingOut}
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#8b3c2d] hover:bg-[#fff6f3] disabled:opacity-60"
                  >
                    <MaterialIcon name="logout" className="text-lg" />
                    {signingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          )}
          <Link
            href="/search"
            className="glass-button hidden items-center gap-1 rounded-xl px-5 py-3 text-sm font-semibold text-white sm:inline-flex"
          >
            Find a domain <MaterialIcon name="arrow_forward" className="text-base" />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="site-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="glass-button-light flex h-11 w-11 items-center justify-center rounded-xl text-[#176b4d] lg:hidden"
          >
            <MaterialIcon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="site-mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-[#e8eee8] bg-white px-5 py-3 lg:hidden"
        >
          {[
            ...navigation,
            { label: "Services", href: "/#services" },
            ...(status === "authenticated" ? [{ label: "Dashboard", href: "/dashboard" }] : []),
            ...(signedOut
              ? [
                  { label: "Sign in", href: "/sign-in" },
                  { label: "Create account", href: "/register" },
                ]
              : []),
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-[#f4f8f2] hover:text-[#176b4d]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/search"
            onClick={() => setMenuOpen(false)}
            className="glass-button mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Find a domain <MaterialIcon name="arrow_forward" className="text-base" />
          </Link>
        </nav>
      )}
    </header>
  );
}
