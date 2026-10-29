"use client";

import Link from "next/link";
import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { FirebaseConfigurationError, getFirebaseAuth } from "@/lib/firebase";

const navigation = [
  { id: "overview", label: "Overview", icon: "grid_view" },
  { id: "domains", label: "My domains", icon: "language" },
  { id: "dns", label: "DNS & nameservers", icon: "dns" },
  { id: "connections", label: "Website connections", icon: "hub" },
  { id: "billing", label: "Orders & billing", icon: "receipt_long" },
  { id: "account", label: "Profile & security", icon: "manage_accounts" },
] as const;

type DashboardSection = (typeof navigation)[number]["id"];

type DashboardState =
  | { status: "loading" }
  | { status: "ready"; user: User }
  | { status: "signed-out" }
  | { status: "unverified"; email: string }
  | { status: "unsupported-role" }
  | { status: "error"; message: string };

function getDashboardError(error: unknown) {
  if (error instanceof FirebaseConfigurationError) {
    return "Firebase configuration is missing. Check .env.local and restart the app.";
  }

  if (error instanceof FirebaseError) {
    if (error.code === "auth/network-request-failed") {
      return "Could not connect to Firebase. Check your internet connection and try again.";
    }

    return "We could not verify your account with Firebase. Please try signing in again.";
  }

  console.error("Unexpected Firebase dashboard error:", error);
  return "An unexpected error occurred while loading your account.";
}

function getDashboardStatusMessage(state: Exclude<DashboardState, { status: "ready" }>) {
  switch (state.status) {
    case "loading":
      return "Loading your secure account...";
    case "signed-out":
      return "Redirecting to sign in...";
    case "unverified":
      return `Verify ${state.email} before opening your dashboard. Sign in again after verifying your email.`;
    case "unsupported-role":
      return "This customer dashboard is not available for your assigned role.";
    case "error":
      return state.message;
  }
}

function getInitials(user: User) {
  const name = user.displayName?.trim();
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  return user.email?.slice(0, 2).toUpperCase() || "U";
}

function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`material-symbols-rounded ${className}`}>
      {name}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
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
      {action}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#dce7dd] bg-[#fafcfa] px-5 py-9 text-center sm:px-8 sm:py-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf6ed] text-2xl text-[#23834b]">
        <Icon name={icon} />
      </span>
      <h3 className="mt-4 font-heading text-base font-bold text-[#344b3b]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#738078]">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warning" | "success";
}) {
  const toneClass = {
    info: "border-[#dce9dd] bg-[#f7fbf6] text-[#526258]",
    warning: "border-[#f0dfbd] bg-[#fffaf0] text-[#745b2e]",
    success: "border-[#cfe6d4] bg-[#f3faf4] text-[#315f3d]",
  }[tone];

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-6 ${toneClass}`}>
      <Icon
        name={tone === "warning" ? "warning" : tone === "success" ? "check_circle" : "info"}
        className="mt-0.5 shrink-0"
      />
      <div>{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [signingOut, setSigningOut] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const preserveAccessMessage = useRef(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve()
      .then(() => getFirebaseAuth())
      .then((auth) => {
        if (!active) return;

        unsubscribe = onAuthStateChanged(
          auth,
          async (user) => {
            if (!active) return;

            if (!user) {
              if (preserveAccessMessage.current) return;
              setState({ status: "signed-out" });
              router.replace("/sign-in");
              return;
            }

            try {
              preserveAccessMessage.current = false;
              await user.reload();
              const claims = await user.getIdTokenResult(true);
              if (!active) return;

              if (!user.emailVerified) {
                const email = user.email ?? "";
                preserveAccessMessage.current = true;
                await signOut(auth);
                if (active) setState({ status: "unverified", email });
                return;
              }

              const role = claims.claims.role;
              if (role !== undefined && role !== "customer") {
                preserveAccessMessage.current = true;
                await signOut(auth);
                if (active) setState({ status: "unsupported-role" });
                return;
              }

              setProfileName(user.displayName ?? "");
              setState({ status: "ready", user });
            } catch (error) {
              if (active) {
                setState({ status: "error", message: getDashboardError(error) });
              }
            }
          },
          (error) => {
            if (active) {
              setState({ status: "error", message: getDashboardError(error) });
            }
          },
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: "error", message: getDashboardError(error) });
        }
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut(getFirebaseAuth());
      router.replace("/sign-in");
    } catch (error) {
      setState({ status: "error", message: getDashboardError(error) });
      setSigningOut(false);
    }
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status !== "ready") return;

    const trimmedName = profileName.trim();
    if (trimmedName.length < 2) {
      setProfileError("Name must contain at least 2 characters.");
      setProfileMessage("");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      await updateProfile(state.user, { displayName: trimmedName });
      setState({ status: "ready", user: state.user });
      setProfileMessage("Your display name has been updated.");
    } catch (error) {
      setProfileError(getDashboardError(error));
    } finally {
      setSavingProfile(false);
    }
  }

  if (state.status !== "ready") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f8f6] px-5 py-12 text-[#26372b]">
        <section
          aria-live="polite"
          className="w-full max-w-lg rounded-3xl border border-[#e7ece8] bg-white p-7 text-center shadow-[0_24px_70px_-45px_rgba(23,65,41,0.35)] sm:p-10"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf6ed] text-2xl text-[#23834b]">
            <Icon
              name={
                state.status === "loading" || state.status === "signed-out"
                  ? "progress_activity"
                  : state.status === "unverified"
                    ? "mark_email_unread"
                    : state.status === "unsupported-role"
                      ? "admin_panel_settings"
                      : "error"
              }
            />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-bold">
            {state.status === "unverified"
              ? "Verify your email"
              : state.status === "unsupported-role"
                ? "Role access unavailable"
                : state.status === "error"
                  ? "Account unavailable"
                  : "Your dashboard"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#68766d]">
            {getDashboardStatusMessage(state)}
          </p>
          {state.status !== "loading" && state.status !== "signed-out" && (
            <Link
              href="/sign-in"
              className="glass-button mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            >
              Return to sign in <Icon name="arrow_forward" />
            </Link>
          )}
        </section>
      </main>
    );
  }

  const { user } = state;
  const displayName = user.displayName?.trim() || user.email?.split("@")[0] || "there";
  const initials = getInitials(user);
  const selectedNavigation = navigation.find((item) => item.id === activeSection);

  function renderOverview() {
    const quickStats = [
      { label: "Your domains", value: "0", icon: "language", note: "No domains connected" },
      { label: "Open orders", value: "0", icon: "shopping_bag", note: "No orders yet" },
      { label: "DNS records", value: "—", icon: "dns", note: "No domain linked" },
      { label: "Account security", value: "Good", icon: "verified_user", note: "Email verified" },
    ];

    const setupSteps = [
      {
        number: "01",
        title: "Find a domain",
        detail: "Explore a name that suits your idea.",
        complete: false,
        href: "/search",
        action: "Search names",
      },
      {
        number: "02",
        title: "Register your domain",
        detail: "Registrar checkout is not connected yet.",
        complete: false,
        href: "/pricing",
        action: "View pricing",
      },
      {
        number: "03",
        title: "Connect your website",
        detail: "Add DNS records after registration.",
        complete: false,
        href: undefined,
        action: "View checklist",
      },
    ];

    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_88%_15%,rgba(121,191,139,0.28),transparent_34%),linear-gradient(125deg,#174f3a,#103b2e_60%,#0d3027)] p-6 text-white shadow-[0_22px_60px_-36px_rgba(13,54,38,0.55)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-1 top-[-3.2rem] h-48 w-48 rounded-full border border-white/10" />
          <div className="relative max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d9f0df]">
              <span className="h-2 w-2 rounded-full bg-[#9fe0ad]" />
              Customer workspace
            </p>
            <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Welcome, {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
              Your account is ready. Start by exploring a domain, then manage
              its connections from this workspace when services are available.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/35 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:bg-white/25"
              >
                <Icon name="search" /> Explore domains
              </Link>
              <button
                type="button"
                onClick={() => setActiveSection("account")}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/15"
              >
                <Icon name="manage_accounts" /> Account settings
              </button>
            </div>
          </div>
        </section>

        <Notice>
          This is your personal account dashboard. Domain registration, DNS
          updates, orders, and billing are not connected to live services yet.
          No sample domains, prices, or transactions are shown as yours.
        </Notice>

        <section aria-label="Account overview" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {quickStats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-[#e5ece6] bg-white p-4 shadow-[0_8px_24px_-22px_rgba(23,65,41,0.3)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#78847b]">{stat.label}</p>
                  <p className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#25372a]">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-[#8a958d]">{stat.note}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf6ed] text-lg text-[#23834b]">
                  <Icon name={stat.icon} />
                </span>
              </div>
            </article>
          ))}
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-heading text-lg font-bold text-[#26372b]">Your getting-started checklist</h2>
                <p className="mt-1 text-xs leading-5 text-[#879188]">A clear path from idea to online home.</p>
              </div>
              <span className="w-fit rounded-full bg-[#f0f7f1] px-3 py-1 text-[10px] font-semibold text-[#4c7656]">0 of 3 steps complete</span>
            </div>
            <div className="mt-5 divide-y divide-[#edf1ed]">
              {setupSteps.map((step) => (
                <div key={step.number} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${step.complete ? "bg-[#eaf6ed] text-[#23834b]" : "bg-[#f3f5f3] text-[#829087]"}`}>
                    {step.complete ? <Icon name="check" /> : step.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#344b3b]">{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#879188]">{step.detail}</p>
                  </div>
                  {step.href ? (
                    <Link href={step.href} className="inline-flex min-h-9 w-fit items-center gap-1 rounded-lg px-3 text-xs font-semibold text-[#176b4d] transition hover:bg-[#f1f7f1]">
                      {step.action} <Icon name="arrow_forward" className="text-base" />
                    </Link>
                  ) : (
                    <button type="button" onClick={() => setActiveSection("connections")} className="inline-flex min-h-9 w-fit items-center gap-1 rounded-lg px-3 text-xs font-semibold text-[#176b4d] transition hover:bg-[#f1f7f1]">
                      {step.action} <Icon name="arrow_forward" className="text-base" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf6ed] text-lg text-[#23834b]">
                <Icon name="shield_with_heart" />
              </span>
              <div>
                <h2 className="font-heading text-sm font-bold text-[#26372b]">Account security</h2>
                <p className="mt-1 text-xs text-[#879188]">Firebase account status</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf7] px-3 py-3">
                <span className="text-xs text-[#647168]">Email verification</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#21834b]">
                  <Icon name="check_circle" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf7] px-3 py-3">
                <span className="text-xs text-[#647168]">Account role</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#4f6856]">Customer</span>
              </div>
            </div>
            <button type="button" onClick={() => setActiveSection("account")} className="mt-4 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#176b4d] hover:bg-[#f1f7f1]">
              Review profile & security <Icon name="arrow_forward" className="text-base" />
            </button>
          </section>
        </div>

        <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#26372b]">Your domains</h2>
              <p className="mt-1 text-xs text-[#879188]">Only domains connected to your account will appear here.</p>
            </div>
            <button type="button" onClick={() => setActiveSection("domains")} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-[#176b4d] hover:bg-[#f1f7f1]">
              Open domain manager <Icon name="arrow_forward" className="text-base" />
            </button>
          </div>
          <EmptyState
            icon="language"
            title="Your domain list is ready when you are"
            description="This account does not have connected domain records yet. Domain registration is not live, so no search result can be purchased from this preview."
            action={
              <Link href="/search" className="glass-button inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white">
                Explore domain names <Icon name="arrow_forward" />
              </Link>
            }
          />
        </section>
      </div>
    );
  }

  function renderDomains() {
    return (
      <div className="space-y-5">
        <SectionHeading
          eyebrow="Domain management"
          title="Your domains"
          description="Manage domain registrations and renewals connected to your account."
          action={
            <Link href="/search" className="glass-button inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white">
              <Icon name="search" /> Search domains
            </Link>
          }
        />
        <Notice tone="warning">
          Domain availability, registration, renewal, and transfer are not
          connected to a registrar. This dashboard will not show invented
          expiry dates or pretend a domain is registered.
        </Notice>
        <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-bold">Domain portfolio</h2>
              <p className="mt-1 text-xs text-[#879188]">0 connected domains</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f5f3] px-3 py-1.5 text-[10px] font-semibold text-[#77837a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#98a49a]" />
              Registrar not connected
            </span>
          </div>
          <EmptyState
            icon="language"
            title="No domains in your portfolio"
            description="When a registrar is connected and a domain is registered to your account, its status, expiry date, renewal setting, and management actions will appear here."
            action={<Link href="/search" className="glass-button inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white">Explore domains <Icon name="arrow_forward" /></Link>}
          />
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf6ee] text-[#23834b]"><Icon name="event_upcoming" /></span>
            <h2 className="mt-4 font-heading text-sm font-bold">Renewals</h2>
            <p className="mt-2 text-xs leading-6 text-[#738078]">Renewal reminders and auto-renew controls will be available after the registrar integration is configured.</p>
            <span className="mt-4 inline-flex rounded-full bg-[#f3f5f3] px-3 py-1.5 text-[10px] font-semibold text-[#77837a]">No renewal data</span>
          </article>
          <article className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2ff] text-[#4e6eb7]"><Icon name="swap_horiz" /></span>
            <h2 className="mt-4 font-heading text-sm font-bold">Domain transfers</h2>
            <p className="mt-2 text-xs leading-6 text-[#738078]">Transfer status, authorization codes, and transfer locks are not available until a registrar is selected.</p>
            <Link href="/transfer" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#176b4d]">Transfer guide <Icon name="arrow_forward" className="text-base" /></Link>
          </article>
        </div>
      </div>
    );
  }

  function renderDns() {
    return (
      <div className="space-y-5">
        <SectionHeading
          eyebrow="Domain configuration"
          title="DNS & nameservers"
          description="Review DNS records and connect domain names to websites, email, and other services."
        />
        <Notice tone="warning">
          No DNS provider or registered domain is connected. We intentionally
          do not show sample nameservers or DNS values; use only the exact
          records supplied by your hosting or email provider.
        </Notice>
        <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf6ed] text-[#23834b]"><Icon name="dns" /></span>
              <div>
                <h2 className="font-heading text-base font-bold">DNS records</h2>
                <p className="mt-1 text-xs text-[#879188]">A, AAAA, CNAME, MX, TXT and other records</p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-[#fff7e8] px-3 py-1.5 text-[10px] font-semibold text-[#916921]">Provider not connected</span>
          </div>
          <div className="mt-6 overflow-hidden rounded-xl border border-[#e8eee8]">
            <div className="hidden grid-cols-[0.7fr_1.2fr_1.5fr_0.7fr] gap-3 bg-[#f7faf7] px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#859188] sm:grid">
              <span>Type</span><span>Name</span><span>Value</span><span>TTL</span>
            </div>
            <EmptyState
              icon="dns"
              title="DNS records will appear here"
              description="Connect a domain and DNS provider to view, add, edit, or remove records."
            />
          </div>
        </section>
        <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0edff] text-[#6a58ae]"><Icon name="conversion_path" /></span>
            <div>
              <h2 className="font-heading text-base font-bold">Nameservers</h2>
              <p className="mt-1 text-xs text-[#879188]">Nameserver changes are made with your registrar.</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-dashed border-[#dce7dd] bg-[#fafcfa] p-5 text-center">
            <p className="text-sm font-semibold text-[#526258]">No domain is connected to manage nameservers.</p>
            <p className="mt-2 text-xs leading-5 text-[#879188]">After a domain and provider are configured, verified nameserver instructions will be shown here.</p>
          </div>
        </section>
        <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-7">
          <h2 className="font-heading text-base font-bold">Common record types</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["A / AAAA", "Point a domain to an IPv4 or IPv6 address."],
              ["CNAME", "Point a hostname to another hostname."],
              ["MX", "Route email to your mail provider."],
              ["TXT", "Add verification or email security records."],
            ].map(([name, description]) => (
              <article key={name} className="rounded-xl bg-[#f7faf7] p-4">
                <h3 className="text-xs font-bold text-[#344b3b]">{name}</h3>
                <p className="mt-2 text-xs leading-5 text-[#7b887e]">{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-[#879188]">These are general descriptions, not DNS values to copy. Always use records supplied by the service you are connecting.</p>
        </section>
      </div>
    );
  }

  function renderConnections() {
    const services = [
      { name: "Website hosting", icon: "language", detail: "Connect a domain to your website host.", state: "Waiting for a domain" },
      { name: "Business email", icon: "mail", detail: "Configure mail routing and sender verification.", state: "Waiting for a domain" },
      { name: "SSL certificate", icon: "lock", detail: "Secure your website with HTTPS through your host.", state: "Waiting for a domain" },
    ];

    return (
      <div className="space-y-5">
        <SectionHeading
          eyebrow="Launch checklist"
          title="Connect your website"
          description="Follow the steps to point a domain to a hosting provider. DNS changes are not applied by this preview."
          action={<Link href="/help/dns-basics" className="glass-button-light inline-flex min-h-10 w-fit items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-[#176b4d]"><Icon name="help" /> DNS guide</Link>}
        />
        <Notice>
          Never copy DNS records from a generic example. Get your exact A,
          CNAME, MX, or TXT values from the provider you are connecting, then
          add them at the authoritative DNS host.
        </Notice>
        <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-7">
          <h2 className="font-heading text-base font-bold">Connection checklist</h2>
          <ol className="mt-5 space-y-4">
            {[
              ["Choose a domain", "Find a suitable name. Live availability checks are not connected.", "Search domains", "/search"],
              ["Choose a website or email provider", "Sign up with the host or mail provider you want to use.", "Read DNS basics", "/help/dns-basics"],
              ["Copy the exact DNS records", "Use the records supplied in the provider's setup instructions.", "Open DNS section", undefined],
              ["Verify the connection", "Use your provider's verification tool and allow time for DNS propagation.", "Review DNS guide", "/help/dns-basics"],
            ].map(([title, detail, action, href], index) => (
              <li key={title} className="flex flex-col gap-3 rounded-xl border border-[#edf1ed] p-4 sm:flex-row sm:items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f5f0] text-xs font-bold text-[#55745d]">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[#344b3b]">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#879188]">{detail}</p>
                </div>
                {href ? (
                  <Link href={href} className="inline-flex min-h-8 w-fit items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#176b4d] hover:bg-[#f1f7f1]">{action}<Icon name="arrow_forward" className="text-base" /></Link>
                ) : (
                  <button type="button" onClick={() => setActiveSection("dns")} className="inline-flex min-h-8 w-fit items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#176b4d] hover:bg-[#f1f7f1]">{action}<Icon name="arrow_forward" className="text-base" /></button>
                )}
              </li>
            ))}
          </ol>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <article key={service.name} className="rounded-2xl border border-[#e5ece6] bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf6ed] text-[#23834b]"><Icon name={service.icon} /></span>
              <h2 className="mt-4 font-heading text-sm font-bold">{service.name}</h2>
              <p className="mt-2 min-h-10 text-xs leading-5 text-[#7b887e]">{service.detail}</p>
              <span className="mt-4 inline-flex rounded-full bg-[#f3f5f3] px-3 py-1.5 text-[10px] font-semibold text-[#77837a]">{service.state}</span>
            </article>
          ))}
        </section>
      </div>
    );
  }

  function renderBilling() {
    return (
      <div className="space-y-5">
        <SectionHeading
          eyebrow="Payments & receipts"
          title="Orders & billing"
          description="Review purchases, invoices, payment methods, and refunds associated with your account."
        />
        <Notice tone="warning">
          Payment processing and order storage are not connected. No payment
          method, invoice, transaction, renewal charge, or refund is recorded
          in this dashboard.
        </Notice>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Orders", "0", "No order history is connected.", "shopping_bag"],
            ["Invoices", "0", "No invoices are available.", "description"],
            ["Payment methods", "Not set up", "A payment gateway is not connected.", "credit_card"],
          ].map(([title, value, detail, icon]) => (
            <article key={title} className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#78847b]">{title}</p>
                  <p className="mt-3 font-heading text-xl font-bold text-[#26372b]">{value}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2ff] text-[#4e6eb7]"><Icon name={icon} /></span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#879188]">{detail}</p>
            </article>
          ))}
        </section>
        <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf2ff] text-[#4e6eb7]"><Icon name="receipt_long" /></span>
            <div>
              <h2 className="font-heading text-base font-bold">Recent transactions</h2>
              <p className="mt-1 text-xs text-[#879188]">A receipt list will appear when checkout is configured.</p>
            </div>
          </div>
          <div className="mt-5">
            <EmptyState icon="receipt_long" title="No transactions to show" description="Your orders and receipts will appear here after a payment provider and order database are connected." />
          </div>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
            <h2 className="font-heading text-sm font-bold">Renewal charges</h2>
            <p className="mt-2 text-xs leading-6 text-[#7b887e]">Renewal pricing and automatic billing depend on the selected registrar, payment provider, and published business policy.</p>
            <span className="mt-4 inline-flex rounded-full bg-[#f3f5f3] px-3 py-1.5 text-[10px] font-semibold text-[#77837a]">Not configured</span>
          </article>
          <article className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
            <h2 className="font-heading text-sm font-bold">Refunds & payment support</h2>
            <p className="mt-2 text-xs leading-6 text-[#7b887e]">Refund terms and transaction support must be confirmed before checkout goes live.</p>
            <Link href="/refund-policy" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#176b4d]">Review draft policy <Icon name="arrow_forward" className="text-base" /></Link>
          </article>
        </div>
      </div>
    );
  }

  function renderAccount() {
    return (
      <div className="space-y-5">
        <SectionHeading
          eyebrow="Personal settings"
          title="Profile & security"
          description="Review your Firebase account details and keep your sign-in secure."
        />
        {profileMessage && <Notice tone="success">{profileMessage}</Notice>}
        {profileError && <Notice tone="warning">{profileError}</Notice>}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3 border-b border-[#edf1ed] pb-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f1e8] text-sm font-bold text-[#176b4d]">{initials}</span>
              <div className="min-w-0">
                <h2 className="font-heading text-base font-bold">Personal information</h2>
                <p className="mt-1 truncate text-xs text-[#879188]">{user.email}</p>
              </div>
            </div>
            <form onSubmit={handleProfileSave} className="mt-5 space-y-5">
              <div>
                <label htmlFor="dashboard-profile-name" className="mb-2 block text-xs font-semibold text-[#526258]">Display name</label>
                <input
                  id="dashboard-profile-name"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  value={profileName}
                  onChange={(event) => {
                    setProfileName(event.target.value);
                    setProfileMessage("");
                    setProfileError("");
                  }}
                  className="register-glass-input min-h-11 w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="dashboard-profile-email" className="mb-2 block text-xs font-semibold text-[#526258]">Email address</label>
                <input
                  id="dashboard-profile-email"
                  type="email"
                  value={user.email ?? ""}
                  readOnly
                  className="min-h-11 w-full rounded-xl border border-[#e5ece6] bg-[#f6f8f6] px-4 py-3 text-sm text-[#738078] outline-none"
                />
                <p className="mt-2 text-[11px] leading-5 text-[#879188]">Email changes require recent sign-in and a separate verification step.</p>
              </div>
              <button
                type="submit"
                disabled={savingProfile || profileName.trim() === (user.displayName ?? "")}
                className="glass-button inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save display name"}
                {!savingProfile && <Icon name="save" />}
              </button>
            </form>
          </section>

          <div className="space-y-5">
            <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
              <h2 className="font-heading text-base font-bold">Sign-in security</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf7] p-3">
                  <span className="text-xs text-[#647168]">Email verification</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#21834b]"><Icon name="verified" /> Verified</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7faf7] p-3">
                  <span className="text-xs text-[#647168]">Account type</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#4f6856]">Customer</span>
                </div>
              </div>
              <Link href="/forgot-password" className="mt-4 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#176b4d] hover:bg-[#f1f7f1]">
                Reset password <Icon name="arrow_forward" className="text-base" />
              </Link>
            </section>
            <section className="rounded-2xl border border-[#e5ece6] bg-white p-5 sm:p-6">
              <h2 className="font-heading text-sm font-bold">Role & access</h2>
              <p className="mt-2 text-xs leading-6 text-[#7b887e]">Your dashboard role is assigned by the platform. Admin and support access cannot be selected in your profile.</p>
              <Notice tone="info">Customer access only</Notice>
            </section>
          </div>
        </div>
      </div>
    );
  }

  const content = {
    overview: renderOverview(),
    domains: renderDomains(),
    dns: renderDns(),
    connections: renderConnections(),
    billing: renderBilling(),
    account: renderAccount(),
  }[activeSection];

  return (
    <main className="min-h-screen bg-[#f5f8f5] text-[#26372b]">
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#e5ece6] bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Domivexa home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176b4d] text-lg font-bold text-white">D</span>
          <span className="font-heading text-xl font-bold tracking-tight">domi<span className="text-[#25865e]">vexa</span></span>
          <span className="ml-1 hidden h-6 border-l border-[#e6ece7] pl-3 text-xs font-medium text-[#89948c] sm:inline-flex sm:items-center">Customer workspace</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-48 truncate text-xs font-medium text-[#68766d] md:block">{user.email}</span>
          <span className="hidden rounded-full bg-[#edf6ee] px-3 py-1.5 text-[10px] font-semibold text-[#176b4d] sm:inline-flex">Customer</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f1e8] text-xs font-bold text-[#176b4d]" aria-label={`Signed in as ${displayName}`}>{initials}</div>
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
        <aside className="hidden border-r border-[#e5ece6] bg-white px-4 py-6 lg:block xl:px-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#98a198]">Workspace</p>
          <nav aria-label="Customer dashboard" className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-current={activeSection === item.id ? "page" : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold transition ${activeSection === item.id ? "bg-[#edf6ee] text-[#176b4d]" : "text-[#68766d] hover:bg-[#f5f8f5] hover:text-[#176b4d]"}`}
              >
                <Icon name={item.icon} className="text-[19px]" /> {item.label}
              </button>
            ))}
          </nav>
          <div className="my-6 border-t border-[#edf1ed]" />
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#98a198]">Explore</p>
          <Link href="/help" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-[#68766d] hover:bg-[#f5f8f5] hover:text-[#176b4d]">
            <Icon name="help" className="text-[19px]" /> Help center
          </Link>
          <Link href="/contact" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-[#68766d] hover:bg-[#f5f8f5] hover:text-[#176b4d]">
            <Icon name="support_agent" className="text-[19px]" /> Contact support
          </Link>
          <div className="mt-8 rounded-2xl border border-[#e7eee8] bg-gradient-to-br from-[#f6faf6] to-[#edf6ee] p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#25865e] shadow-sm"><Icon name="lightbulb" /></span>
            <h2 className="mt-3 text-xs font-bold">Need a hand?</h2>
            <p className="mt-1.5 text-[11px] leading-5 text-[#718078]">Browse simple guides for domains and DNS.</p>
            <Link href="/help" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#176b4d]">Visit help center <Icon name="arrow_forward" className="text-sm" /></Link>
          </div>
        </aside>

        <div className="min-w-0">
          <nav aria-label="Dashboard sections" className="sticky top-[68px] z-20 border-b border-[#e5ece6] bg-white/95 px-3 py-2 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-full gap-1 overflow-x-auto">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  aria-current={activeSection === item.id ? "page" : undefined}
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[11px] font-semibold transition ${activeSection === item.id ? "bg-[#edf6ee] text-[#176b4d]" : "text-[#68766d] hover:bg-[#f5f8f5]"}`}
                >
                  <Icon name={item.icon} className="text-base" />
                  <span className="hidden min-[420px]:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <section className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9 xl:px-10">
            <div className="mx-auto max-w-[1320px]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#789080]">
                  <Icon name={selectedNavigation?.icon ?? "grid_view"} className="text-base text-[#25865e]" />
                  {selectedNavigation?.label}
                </p>
                <Link href="/search" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-[#176b4d] hover:bg-[#edf6ee]">
                  <Icon name="add" /> <span className="hidden sm:inline">Find a domain</span>
                </Link>
              </div>
              {content}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
