import type { ReactNode } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/marketing/material-icon";

export function PublicPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[65vh] bg-[linear-gradient(180deg,#f3f8f2_0%,#fcfdfb_360px)] px-5 py-12 text-[#172b22] sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25865e]">{eyebrow}</p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-5 text-base leading-8 text-[#59685e] sm:text-lg">{intro}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="flex items-start gap-3 rounded-2xl border border-[#dce9dd] bg-white/85 p-4 text-sm leading-6 text-[#526258] shadow-sm">
      <MaterialIcon name="info" className="mt-0.5 shrink-0 text-[#25865e]" />
      <p>{children}</p>
    </div>
  );
}

export function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[#e7ece7] bg-white p-6 shadow-[0_8px_24px_-20px_rgba(23,65,41,0.3)] sm:p-7">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf4eb] text-[#218259]">
        <MaterialIcon name={icon} />
      </span>
      <h2 className="mt-5 font-heading text-lg font-bold">{title}</h2>
      <div className="mt-3 leading-7 text-[#59685e]">{children}</div>
    </article>
  );
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="glass-button inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white">
      {children}
      <MaterialIcon name="arrow_forward" className="text-base" />
    </Link>
  );
}
