"use client";

import Link from "next/link";
import { useState } from "react";
import { MaterialIcon } from "@/components/marketing/material-icon";

const navigation = [
  { label: "Domains", href: "/domains" },
  { label: "Pricing", href: "/pricing" },
  { label: "Transfer", href: "/transfer" },
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8eee8] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Domivexa home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#176b4d] text-xl font-bold text-white shadow-sm shadow-[#176b4d]/20">
            D
          </span>
          <span className="font-heading text-[1.4rem] font-bold tracking-tight">
            domi<span className="text-[#25865e]">vexa</span>
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
          <Link href="/dashboard" className="transition-colors hover:text-[#176b4d]">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
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
          {[...navigation, { label: "Services", href: "/#services" }, { label: "Dashboard", href: "/dashboard" }, { label: "Sign in", href: "/sign-in" }, { label: "Create account", href: "/register" }].map((item) => (
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
