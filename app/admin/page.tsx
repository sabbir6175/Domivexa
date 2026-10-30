"use client";

import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { MaterialIcon } from "@/components/marketing/material-icon";
import { FirebaseConfigurationError, getFirebaseAuth } from "@/lib/firebase";
import { signOutAndClearSession } from "@/lib/auth-session";

const navigation = [
  { id: "overview", label: "Overview", icon: "grid_view" },
  { id: "users", label: "Users", icon: "group" },
  { id: "domains", label: "Domains", icon: "language" },
  { id: "orders", label: "Orders & billing", icon: "receipt_long" },
  { id: "support", label: "Support", icon: "support_agent" },
  { id: "integrations", label: "Integrations", icon: "hub" },
] as const;

type AdminSection = (typeof navigation)[number]["id"];

type AdminAccessState =
  | { status: "loading" }
  | { status: "allowed"; user: User }
  | { status: "denied" }
  | { status: "error"; message: string };

function getErrorMessage(error: unknown) {
  if (error instanceof FirebaseConfigurationError) {
    return "Firebase configuration is missing. Check .env.local and restart the app.";
  }

  if (error instanceof FirebaseError && error.code === "auth/network-request-failed") {
    return "Could not connect to Firebase. Check your internet connection and try again.";
  }

  console.error("Could not verify admin dashboard access:", error);
  return "We could not verify your admin access. Please try again.";
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <MaterialIcon
      name={name}
      className={className}
    />
  );
}

function AdminPageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#25865e]">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#1d3024] sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#738078]">
        {description}
      </p>
    </div>
  );
}

function IntegrationNotice() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#dce9dd] bg-white/80 px-4 py-3.5 text-sm leading-6 text-[#526258]">
      <Icon name="info" className="mt-0.5 shrink-0 text-[#25865e]" />
      <p>
        Admin interface is ready, but customer, domain, order, and support data
        are not connected yet. No sample records or counts are shown.
      </p>
    </div>
  );
}

function EmptyPanel({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[#d8e5d9] bg-white/80 px-5 py-12 text-center sm:px-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4eb] text-2xl text-[#25865e]">
        <Icon name={icon} />
      </span>
      <h2 className="mt-4 font-heading text-base font-bold text-[#344b3b]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#738078]">
        {description}
      </p>
    </section>
  );
}

function OverviewSection() {
  const cards = [
    { title: "Customers", icon: "group", source: "User directory not connected" },
    { title: "Domains", icon: "language", source: "Registrar not connected" },
    { title: "Orders", icon: "receipt_long", source: "Order database not connected" },
    { title: "Open support", icon: "support_agent", source: "Support system not connected" },
  ];

  return (
    <>
      <AdminPageHeading
        eyebrow="Administration"
        title="Admin overview"
        description="A central workspace for managing Domivexa operations."
      />
      <IntegrationNotice />
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-[#e5ece6] bg-white p-5 shadow-[0_8px_24px_-22px_rgba(23,65,41,0.3)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#526258]">{card.title}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4eb] text-xl text-[#25865e]">
                <Icon name={card.icon} />
              </span>
            </div>
            <p className="mt-5 font-heading text-2xl font-bold text-[#344b3b]">—</p>
            <p className="mt-1 text-xs leading-5 text-[#879188]">{card.source}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-bold text-[#344b3b]">
                Recent activity
              </h2>
              <p className="mt-1 text-xs text-[#879188]">
                Latest changes across the platform
              </p>
            </div>
            <Icon name="history" className="text-xl text-[#7c9a82]" />
          </div>
          <div className="mt-5">
            <EmptyPanel
              icon="history"
              title="Activity log is not connected"
              description="Connect an audit-log source to review administrator and customer activity here."
            />
          </div>
        </section>
        <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
          <h2 className="font-heading text-base font-bold text-[#344b3b]">
            Platform connections
          </h2>
          <div className="mt-4 space-y-3">
            {[
              ["Firebase Authentication", "Connected", "check_circle"],
              ["Customer database", "Not connected", "database"],
              ["Domain registrar", "Not connected", "language"],
              ["Payments", "Not connected", "payments"],
            ].map(([label, status, icon]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf7] px-3 py-3"
              >
                <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#526258]">
                  <Icon name={icon} className="text-lg text-[#6d8d73]" />
                  <span className="truncate">{label}</span>
                </span>
                <span
                  className={`shrink-0 text-[10px] font-semibold ${status === "Connected" ? "text-[#21834b]" : "text-[#879188]"}`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function AdminSectionContent({ section }: { section: AdminSection }) {
  switch (section) {
    case "overview":
      return <OverviewSection />;
    case "users":
      return (
        <>
          <AdminPageHeading
            eyebrow="Administration / Users"
            title="User management"
            description="Review customer accounts and access status."
          />
          <IntegrationNotice />
          <EmptyPanel
            icon="group"
            title="User directory is not connected"
            description="Listing or changing Firebase Authentication users requires a trusted server using Firebase Admin SDK. Connect that service before enabling user-management actions."
          />
        </>
      );
    case "domains":
      return (
        <>
          <AdminPageHeading
            eyebrow="Administration / Domains"
            title="Domain management"
            description="Monitor customer domains, renewals, DNS, and registrar status."
          />
          <IntegrationNotice />
          <EmptyPanel
            icon="language"
            title="Registrar data is not connected"
            description="Connect a domain registrar and a server-side domain data source to manage real domains and renewal status."
          />
        </>
      );
    case "orders":
      return (
        <>
          <AdminPageHeading
            eyebrow="Administration / Orders"
            title="Orders & billing"
            description="Review purchases, invoices, transactions, and refunds."
          />
          <IntegrationNotice />
          <EmptyPanel
            icon="receipt_long"
            title="Orders and payments are not connected"
            description="No order, invoice, or payment records are available. Connect an order database and payment provider before enabling billing actions."
          />
        </>
      );
    case "support":
      return (
        <>
          <AdminPageHeading
            eyebrow="Administration / Support"
            title="Support workspace"
            description="Review customer requests and coordinate support follow-up."
          />
          <IntegrationNotice />
          <EmptyPanel
            icon="support_agent"
            title="Support inbox is not connected"
            description="Connect a support-ticket system to review incoming requests and manage their status."
          />
        </>
      );
    case "integrations":
      return (
        <>
          <AdminPageHeading
            eyebrow="Administration / Integrations"
            title="Platform integrations"
            description="Track the services needed to power the admin workspace."
          />
          <section className="grid gap-4 md:grid-cols-2">
            {[
              {
                name: "Firebase Authentication",
                detail: "Used for sign-in and verified administrator identity.",
                status: "Connected",
                icon: "verified_user",
              },
              {
                name: "Customer database",
                detail: "Needed for user-owned domains, orders, and customer records.",
                status: "Not connected",
                icon: "database",
              },
              {
                name: "Domain registrar",
                detail: "Needed for availability, registration, transfer, and renewal data.",
                status: "Not connected",
                icon: "language",
              },
              {
                name: "Payments",
                detail: "Needed for transactions, invoices, and refund status.",
                status: "Not connected",
                icon: "payments",
              },
              {
                name: "Support platform",
                detail: "Needed for a real support inbox and ticket workflow.",
                status: "Not connected",
                icon: "support_agent",
              },
              {
                name: "Server-side authorization",
                detail: "Required before exposing private records or admin actions.",
                status: "Required before private data",
                icon: "admin_panel_settings",
              },
            ].map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf4eb] text-xl text-[#25865e]">
                    <Icon name={item.icon} />
                  </span>
                  <span className="rounded-full bg-[#f3f6f3] px-2.5 py-1 text-[10px] font-semibold text-[#68766d]">
                    {item.status}
                  </span>
                </div>
                <h2 className="mt-4 font-heading text-base font-bold text-[#344b3b]">
                  {item.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#738078]">
                  {item.detail}
                </p>
              </article>
            ))}
          </section>
        </>
      );
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { status: authStatus, user: authUser, error: authError } = useAuth();
  const [access, setAccess] = useState<AdminAccessState>({ status: "loading" });
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    if (authStatus === "loading") return;

    void Promise.resolve().then(async () => {
      if (!active) return;

      if (authStatus === "signed-out") {
        setAccess({ status: "denied" });
        router.replace("/admin-login");
        return;
      }

      if (authStatus === "error") {
        setAccess({ status: "error", message: getErrorMessage(authError) });
        return;
      }

      if (!authUser) {
        setAccess({ status: "denied" });
        return;
      }

      try {
        await authUser.reload();
        if (!active) return;

        if (!authUser.emailVerified) {
          setAccess({ status: "denied" });
          return;
        }

        setAccess({ status: "allowed", user: authUser });
      } catch (error) {
        if (active) {
          setAccess({ status: "error", message: getErrorMessage(error) });
        }
      }
    });

    return () => {
      active = false;
    };
  }, [authStatus, authUser, authError, router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutAndClearSession(getFirebaseAuth());
      router.replace("/sign-in");
    } catch (error) {
      setAccess({ status: "error", message: getErrorMessage(error) });
      setSigningOut(false);
    }
  }

  if (access.status !== "allowed") {
    const isLoading = access.status === "loading";
    const isDenied = access.status === "denied";
    const message = isLoading
      ? "Verifying your administrator access..."
      : isDenied
        ? "This account does not have the admin role in the server-managed user record."
        : access.message;

    return (
      <main className="flex min-h-[75vh] items-center justify-center px-5 py-12 text-[#26372b]">
        <section
          aria-live="polite"
          className="w-full max-w-lg rounded-3xl border border-[#e5ece6] bg-white p-7 text-center shadow-[0_24px_70px_-45px_rgba(23,65,41,0.35)] sm:p-10"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4eb] text-2xl text-[#25865e]">
            <Icon name={isLoading ? "progress_activity" : isDenied ? "lock" : "error"} />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold">
            {isLoading ? "Admin access" : isDenied ? "Access restricted" : "Could not verify access"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#68766d]">{message}</p>
          {!isLoading && (
            <Link
              href="/dashboard"
              className="glass-button mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            >
              Return to dashboard <Icon name="arrow_forward" />
            </Link>
          )}
        </section>
      </main>
    );
  }

  const { user } = access;
  const activeItem = navigation.find((item) => item.id === activeSection);
  const initials =
    user.displayName?.trim().slice(0, 1).toUpperCase() ||
    user.email?.slice(0, 1).toUpperCase() ||
    "A";

  return (
    <main className="min-h-screen bg-transparent text-[#26372b]">
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#e5ece6] bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Domivexa home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176b4d] text-lg font-bold text-white">
            D
          </span>
          <span className="font-heading text-lg font-bold tracking-tight sm:text-xl">
            Domi<span className="text-[#25865e]">vexa</span>
          </span>
          <span className="ml-1 hidden h-6 items-center border-l border-[#e6ece7] pl-3 text-xs font-medium text-[#89948c] sm:inline-flex">
            Admin console
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-48 truncate text-xs font-medium text-[#68766d] md:block">
            {user.email}
          </span>
          <span className="hidden rounded-full bg-[#edf6ee] px-3 py-1.5 text-[10px] font-semibold text-[#176b4d] sm:inline-flex">
            Administrator
          </span>
          <span
            aria-label={`Signed in as ${user.displayName || user.email || "administrator"}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f1e8] text-xs font-bold text-[#176b4d]"
          >
            {initials}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="glass-button-light inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-[#176b4d] disabled:opacity-60 sm:px-3"
          >
            <Icon name="logout" />
            <span className="hidden sm:inline">{signingOut ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-68px)] max-w-[1680px] lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#e5ece6] bg-white/80 px-4 py-6 lg:block xl:px-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#98a198]">
            Workspace
          </p>
          <nav aria-label="Admin dashboard sections" className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-current={activeSection === item.id ? "page" : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold transition ${activeSection === item.id ? "bg-[#edf6ee] text-[#176b4d]" : "text-[#68766d] hover:bg-[#f5f8f5] hover:text-[#176b4d]"}`}
              >
                <Icon name={item.icon} className="text-[19px]" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="my-6 border-t border-[#edf1ed]" />
          <div className="rounded-2xl bg-[#f5f8f5] p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg text-[#25865e] shadow-sm">
              <Icon name="admin_panel_settings" />
            </span>
            <p className="mt-3 text-xs font-semibold text-[#344b3b]">Protected workspace</p>
            <p className="mt-1 text-[11px] leading-5 text-[#7b887e]">
              Admin access is restricted to the configured administrator email.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <nav
            aria-label="Admin dashboard sections"
            className="sticky top-[68px] z-20 flex gap-1 overflow-x-auto border-b border-[#e5ece6] bg-white/95 px-3 py-2 backdrop-blur-xl lg:hidden"
          >
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-current={activeSection === item.id ? "page" : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition ${activeSection === item.id ? "bg-[#edf6ee] text-[#176b4d]" : "text-[#68766d] hover:bg-[#f5f8f5]"}`}
              >
                <Icon name={item.icon} className="text-lg" />
                {item.label}
              </button>
            ))}
          </nav>
          <section className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="mb-5 flex items-center gap-2 text-xs text-[#879188]">
              <Icon name={activeItem?.icon ?? "grid_view"} className="text-lg text-[#25865e]" />
              <span>{activeItem?.label ?? "Overview"}</span>
            </div>
            <div className="mx-auto max-w-[1400px]">
              <AdminSectionContent section={activeSection} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
