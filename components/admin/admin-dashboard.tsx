"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { MaterialIcon } from "@/components/marketing/material-icon";
import { getFirebaseAuth } from "@/lib/firebase";
import type { AccountRole } from "@/lib/backend-client";

type AdminSection =
  | "overview"
  | "customers"
  | "orders"
  | "pricing"
  | "domains"
  | "support"
  | "integrations"
  | "audit";

type Overview = {
  users: { total: number; admins: number; customers: number };
  domains: number;
  orders: number;
  supportTickets: number;
  registrationFailures: number;
  paymentExceptions: number;
  renewalsDue: number;
};

type AdminUser = {
  firebaseUid: string;
  email: string;
  displayName: string;
  role: AccountRole;
  emailVerified: boolean;
  status?: "active" | "suspended";
  createdAt?: string;
};

type UserList = {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
};

type PageResult = {
  page: number;
  limit: number;
  total: number;
};

type DomainRecord = {
  id: string;
  domain?: string;
  name?: string;
  ownerUid?: string;
  ownerEmail?: string;
  status?: string;
  expiresAt?: string;
  provider?: string;
  providerReference?: string;
};

type OrderRecord = {
  id: string;
  orderNumber?: string;
  customerEmail?: string;
  domain?: string;
  amount?: number;
  currency?: string;
  status?: string;
  paymentStatus?: string;
  registrationStatus?: string;
  paymentReference?: string;
  registrarReference?: string;
  refundStatus?: string;
  createdAt?: string;
};

type PricingRecord = {
  id: string;
  tld: string;
  registrationPrice: number;
  renewalPrice: number;
  transferPrice: number;
  currency: string;
  enabled: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
};

type SupportTicket = {
  id: string;
  subject?: string;
  customerEmail?: string;
  customerUid?: string;
  message?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  createdAt?: string;
  internalNotes?: Array<{ actorEmail: string; message: string; createdAt: string }>;
  customerReplies?: Array<{ actorEmail: string; message: string; createdAt: string }>;
};

type IntegrationStatus = {
  name: string;
  configured: boolean;
  healthy: boolean;
  detail: string;
};

type AuditEntry = {
  id: string;
  actorUid?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  outcome: "success" | "failure";
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
};

type PricingForm = Omit<PricingRecord, "id" | "effectiveFrom" | "effectiveTo"> & {
  id?: string;
  effectiveFrom: string;
  effectiveTo: string;
};

const sections: Array<{
  id: AdminSection;
  label: string;
  icon: string;
}> = [
  { id: "overview", label: "Overview", icon: "grid_view" },
  { id: "customers", label: "Users", icon: "group" },
  { id: "orders", label: "Orders", icon: "receipt_long" },
  { id: "pricing", label: "Pricing", icon: "sell" },
  { id: "domains", label: "Domains", icon: "language" },
  { id: "support", label: "Support", icon: "support_agent" },
  { id: "integrations", label: "Integrations", icon: "hub" },
  { id: "audit", label: "Audit log", icon: "history" },
];

const emptyOverview: Overview = {
  users: { total: 0, admins: 0, customers: 0 },
  domains: 0,
  orders: 0,
  supportTickets: 0,
  registrationFailures: 0,
  paymentExceptions: 0,
  renewalsDue: 0,
};

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL must be configured for the Express API.");
  }
  return apiUrl;
}

async function adminRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "The admin request could not be completed.";
    throw new Error(message);
  }
  return body as T;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#f1d8d2] bg-[#fff8f6] p-4 text-sm leading-6 text-[#8b3c2d]">
      <MaterialIcon name="error" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent = false,
}: {
  label: string;
  value: number;
  detail: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${accent ? "border-[#cfe6d4] bg-[#f3faf4]" : "border-[#e5ece6] bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#68766d]">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf6ed] text-lg text-[#23834b]">
          <MaterialIcon name={icon} />
        </span>
      </div>
      <p className="mt-4 font-heading text-3xl font-bold tracking-tight text-[#1d3024]">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-[#879188]">{detail}</p>
    </article>
  );
}

function Pagination({
  page,
  limit,
  total,
  loading,
  onChange,
}: {
  page: number;
  limit: number;
  total: number;
  loading: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#edf1ed] px-5 py-4">
      <p className="text-xs text-[#879188]">
        {total === 0 ? "No records" : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1 || loading} className="min-h-9 rounded-lg border border-[#dfe8e0] px-3 text-xs font-semibold text-[#526258] disabled:opacity-40">Previous</button>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page * limit >= total || loading} className="min-h-9 rounded-lg border border-[#dfe8e0] px-3 text-xs font-semibold text-[#526258] disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

function UserTable({
  users,
  currentUid,
  updatingUid,
  onRoleChange,
  onStatusChange,
}: {
  users: AdminUser[];
  currentUid: string;
  updatingUid: string | null;
  onRoleChange: (user: AdminUser) => void;
  onStatusChange: (user: AdminUser) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <MaterialIcon name="person_search" className="text-3xl text-[#9aa69c]" />
        <p className="mt-3 text-sm font-semibold text-[#344b3b]">No users found</p>
        <p className="mt-1 text-xs text-[#879188]">Try a different search or check back when accounts are created.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left">
        <thead className="bg-[#f8faf8] text-[10px] font-bold uppercase tracking-[0.12em] text-[#879188]">
          <tr>
            <th className="px-5 py-3">User</th>
            <th className="px-5 py-3">Role</th>
            <th className="px-5 py-3">Account status</th>
            <th className="px-5 py-3">Email status</th>
            <th className="px-5 py-3">Joined</th>
            <th className="px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1ed]">
          {users.map((user) => {
            const isSelf = user.firebaseUid === currentUid;
            const isUpdating = updatingUid === user.firebaseUid;
            const displayName = user.displayName?.trim() || user.email;
            return (
              <tr key={user.firebaseUid} className="text-sm hover:bg-[#fbfcfb]">
                <td className="px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf2eb] text-xs font-bold uppercase text-[#176b4d]">
                      {displayName.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[#344b3b]">{displayName}</span>
                      <span className="mt-1 block max-w-64 truncate text-xs text-[#879188]">{user.email}</span>
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${user.role === "admin" ? "bg-[#eaf0ff] text-[#425fa3]" : "bg-[#edf6ee] text-[#176b4d]"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${user.status === "suspended" ? "bg-[#fff0ed] text-[#a64132]" : "bg-[#edf6ee] text-[#176b4d]"}`}>
                    {user.status ?? "active"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.emailVerified ? "text-[#21834b]" : "text-[#9a6a20]"}`}>
                    <MaterialIcon name={user.emailVerified ? "verified" : "schedule"} />
                    {user.emailVerified ? "Verified" : "Unverified"}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-[#68766d]">{formatDate(user.createdAt)}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onRoleChange(user)}
                      disabled={isSelf || isUpdating}
                      title={isSelf ? "You cannot change your own role" : undefined}
                      className="glass-button-light inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#176b4d] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isUpdating ? "Saving..." : user.role === "admin" ? "Make customer" : "Make admin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(user)}
                      disabled={isSelf || isUpdating}
                      title={isSelf ? "You cannot suspend your own account" : undefined}
                      className="min-h-9 rounded-lg border border-[#dfe8e0] px-3 text-xs font-semibold text-[#526258] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {user.status === "suspended" ? "Activate" : "Suspend"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard({ currentUid }: { currentUid: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [section, setSection] = useState<AdminSection>("overview");
  const [overview, setOverview] = useState<Overview>(emptyOverview);
  const [users, setUsers] = useState<UserList>({ users: [], page: 1, limit: 10, total: 0 });
  const [orders, setOrders] = useState<PageResult & { orders: OrderRecord[] }>({
    orders: [],
    page: 1,
    limit: 10,
    total: 0,
  });
  const [domains, setDomains] = useState<PageResult & { domains: DomainRecord[] }>({
    domains: [],
    page: 1,
    limit: 10,
    total: 0,
  });
  const [pricing, setPricing] = useState<PricingRecord[]>([]);
  const [support, setSupport] = useState<PageResult & { tickets: SupportTicket[] }>({
    tickets: [],
    page: 1,
    limit: 10,
    total: 0,
  });
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [auditEntries, setAuditEntries] = useState<PageResult & { entries: AuditEntry[] }>({
    entries: [],
    page: 1,
    limit: 25,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [pricingForm, setPricingForm] = useState<PricingForm | null>(null);

  const loadData = useCallback(async (signal: AbortSignal) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      if (signal.aborted) return;
      setLoading(true);
      setLoadError("");
      if (section === "overview") {
        const [overviewData, usersData, integrationData] = await Promise.all([
          adminRequest<Overview>("/api/admin/overview", token, { signal }),
          adminRequest<UserList>("/api/admin/users?page=1&limit=5", token, { signal }),
          adminRequest<{ integrations: IntegrationStatus[] }>("/api/admin/integrations", token, { signal }),
        ]);
        setOverview(overviewData);
        setUsers(usersData);
        setIntegrations(integrationData.integrations);
      } else if (section === "customers") {
        const usersData = await adminRequest<UserList>(
          `/api/admin/users?page=${page}&limit=50&q=${encodeURIComponent(search)}`,
          token,
          { signal },
        );
        setUsers(usersData);
      } else if (section === "orders") {
        setOrders(await adminRequest(`/api/admin/orders?page=${page}&limit=20`, token, { signal }));
      } else if (section === "domains") {
        setDomains(await adminRequest(`/api/admin/domains?page=${page}&limit=20&q=${encodeURIComponent(search)}`, token, { signal }));
      } else if (section === "pricing") {
        setPricing((await adminRequest<{ pricing: PricingRecord[] }>("/api/admin/pricing", token, { signal })).pricing);
      } else if (section === "support") {
        setSupport(await adminRequest(`/api/admin/support?page=${page}&limit=20`, token, { signal }));
      } else if (section === "integrations") {
        setIntegrations((await adminRequest<{ integrations: IntegrationStatus[] }>("/api/admin/integrations", token, { signal })).integrations);
      } else if (section === "audit") {
        setAuditEntries(await adminRequest(`/api/admin/audit?page=${page}&limit=50`, token, { signal }));
      }
    } catch (error) {
      if (signal.aborted) return;
      console.error("Could not load admin dashboard:", error);
      setLoadError(error instanceof Error ? error.message : "Could not load dashboard data.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [user, section, page, search]);

  useEffect(() => {
    const controller = new AbortController();
    const timerId = window.setTimeout(() => void loadData(controller.signal), 0);
    return () => {
      window.clearTimeout(timerId);
      controller.abort();
    };
  }, [loadData]);

  const activeSection = useMemo(
    () => sections.find((item) => item.id === section) ?? sections[0],
    [section],
  );

  function navigateToSection(nextSection: AdminSection) {
    setSection(nextSection);
    setSearch("");
    setPage(1);
  }

  async function handleRoleChange(target: AdminUser) {
    if (!user || target.firebaseUid === currentUid) return;
    const role: AccountRole = target.role === "admin" ? "customer" : "admin";
    const confirmed = window.confirm(
      `Change ${target.email}'s role to ${role}?`,
    );
    if (!confirmed) return;

    setUpdatingUid(target.firebaseUid);
    setActionMessage("");
    setLoadError("");
    try {
      await adminRequest(
        `/api/admin/users/${encodeURIComponent(target.firebaseUid)}/role`,
        await user.getIdToken(),
        { method: "PATCH", body: JSON.stringify({ role }) },
      );
      setActionMessage(`${target.email} is now ${role}.`);
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (error) {
      console.error("Could not update user role:", error);
      setLoadError(error instanceof Error ? error.message : "Could not update user role.");
    } finally {
      setUpdatingUid(null);
    }
  }

  async function handleStatusChange(target: AdminUser) {
    if (!user || target.firebaseUid === currentUid) return;
    const status = target.status === "suspended" ? "active" : "suspended";
    const confirmed = window.confirm(
      `${status === "suspended" ? "Suspend" : "Activate"} ${target.email}?`,
    );
    if (!confirmed) return;

    setUpdatingUid(target.firebaseUid);
    setActionMessage("");
    setLoadError("");
    try {
      await adminRequest(
        `/api/admin/users/${encodeURIComponent(target.firebaseUid)}/status`,
        await user.getIdToken(),
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setActionMessage(`${target.email} is now ${status}.`);
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (error) {
      console.error("Could not update customer status:", error);
      setLoadError(error instanceof Error ? error.message : "Could not update customer status.");
    } finally {
      setUpdatingUid(null);
    }
  }

  function startPricingForm(record?: PricingRecord) {
    setPricingForm(
      record
        ? {
            ...record,
            effectiveFrom: record.effectiveFrom.slice(0, 10),
            effectiveTo: record.effectiveTo?.slice(0, 10) ?? "",
          }
        : {
            tld: "",
            registrationPrice: 0,
            renewalPrice: 0,
            transferPrice: 0,
            currency: "USD",
            enabled: true,
            effectiveFrom: new Date().toISOString().slice(0, 10),
            effectiveTo: "",
          },
    );
  }

  async function handleSavePricing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !pricingForm) return;
    setUpdatingUid(pricingForm.id ?? "new-pricing");
    setActionMessage("");
    setLoadError("");
    try {
      const payload = {
        ...pricingForm,
        effectiveFrom: new Date(pricingForm.effectiveFrom).toISOString(),
        effectiveTo: pricingForm.effectiveTo
          ? new Date(`${pricingForm.effectiveTo}T23:59:59.999Z`).toISOString()
          : null,
      };
      await adminRequest(
        pricingForm.id
          ? `/api/admin/pricing/${encodeURIComponent(pricingForm.id)}`
          : "/api/admin/pricing",
        await user.getIdToken(),
        {
          method: pricingForm.id ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setActionMessage(`${pricingForm.tld} pricing saved.`);
      setPricingForm(null);
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (error) {
      console.error("Could not save TLD pricing:", error);
      setLoadError(error instanceof Error ? error.message : "Could not save pricing.");
    } finally {
      setUpdatingUid(null);
    }
  }

  async function updateSupportTicket(ticket: SupportTicket, changes: Record<string, string>) {
    if (!user) return;
    setUpdatingUid(ticket.id);
    setActionMessage("");
    setLoadError("");
    try {
      await adminRequest(
        `/api/admin/support/${encodeURIComponent(ticket.id)}`,
        await user.getIdToken(),
        { method: "PATCH", body: JSON.stringify(changes) },
      );
      setActionMessage(`Ticket ${ticket.id} updated.`);
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (error) {
      console.error("Could not update support ticket:", error);
      setLoadError(error instanceof Error ? error.message : "Could not update ticket.");
    } finally {
      setUpdatingUid(null);
    }
  }

  function addTicketNote(ticket: SupportTicket, field: "internalNote" | "customerReply") {
    const title = field === "internalNote" ? "Add internal note (customers cannot see this)" : "Write customer-visible reply";
    const message = window.prompt(title);
    if (message?.trim()) void updateSupportTicket(ticket, { [field]: message.trim() });
  }

  async function handleSignOut() {
    setSigningOut(true);
    setLoadError("");
    try {
      await signOut(getFirebaseAuth());
      router.replace("/sign-in");
    } catch (error) {
      console.error("Could not sign out from the admin dashboard:", error);
      setLoadError("Sign out could not be completed. Please try again.");
      setSigningOut(false);
    }
  }

  const displayName = user?.displayName?.trim() || user?.email || "Administrator";

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f6f9f6] text-[#26372b]">
      <header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between border-b border-[#e5ece6] bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <Link href="/admin" className="flex items-center gap-2.5" aria-label="Domivexa admin home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176b4d] text-lg font-bold text-white">D</span>
          <span className="font-heading text-lg font-bold tracking-tight">Domivexa<span className="ml-2 text-xs font-medium text-[#879188]">Admin</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-56 truncate text-xs text-[#68766d] sm:block">{user?.email}</span>
          <button type="button" onClick={handleSignOut} disabled={signingOut} className="glass-button-light inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#176b4d] disabled:opacity-60">
            <MaterialIcon name="logout" /> {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[244px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-68px)] border-r border-[#e5ece6] bg-white px-4 py-6 lg:block">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#98a198]">Workspace</p>
          <nav aria-label="Admin dashboard" className="space-y-1">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateToSection(item.id)}
                aria-current={section === item.id ? "page" : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold transition ${section === item.id ? "bg-[#edf6ee] text-[#176b4d]" : "text-[#68766d] hover:bg-[#f5f8f5] hover:text-[#176b4d]"}`}
              >
                <MaterialIcon name={item.icon} className="text-[19px]" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-2xl border border-[#e7eee8] bg-gradient-to-br from-[#f6faf6] to-[#edf6ee] p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#25865e] shadow-sm"><MaterialIcon name="verified_user" /></span>
            <h2 className="mt-3 text-xs font-bold">Admin access verified</h2>
            <p className="mt-1.5 break-all text-[11px] leading-5 text-[#718078]">{displayName}</p>
          </div>
        </aside>

        <div className="min-w-0">
          <nav aria-label="Admin sections" className="sticky top-[68px] z-20 border-b border-[#e5ece6] bg-white/95 px-3 py-2 backdrop-blur-xl lg:hidden">
            <div className="flex gap-1 overflow-x-auto">
              {sections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToSection(item.id)}
                  aria-current={section === item.id ? "page" : undefined}
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[11px] font-semibold ${section === item.id ? "bg-[#edf6ee] text-[#176b4d]" : "text-[#68766d]"}`}
                >
                  <MaterialIcon name={item.icon} className="text-base" />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          <section className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
            <div className="mx-auto max-w-[1320px]">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#25865e]">Administrator workspace</p>
                  <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#1d3024] sm:text-3xl">{activeSection.label}</h1>
                  <p className="mt-2 text-sm text-[#738078]">Welcome back, {displayName}.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const controller = new AbortController();
                    void loadData(controller.signal);
                  }}
                  disabled={loading}
                  className="glass-button-light inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl px-4 text-xs font-semibold text-[#176b4d] disabled:opacity-50 sm:self-auto"
                >
                  <MaterialIcon name={loading ? "progress_activity" : "refresh"} className={loading ? "animate-spin" : ""} />
                  Refresh data
                </button>
              </div>

              {loadError && <div className="mb-5"><ErrorNotice>{loadError}</ErrorNotice></div>}
              {actionMessage && <p role="status" className="mb-5 rounded-xl border border-[#cfe6d4] bg-[#f3faf4] px-4 py-3 text-sm text-[#315f3d]">{actionMessage}</p>}

              {section === "overview" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Order volume" value={overview.orders} detail="Orders in MongoDB" icon="receipt_long" accent />
                    <MetricCard label="Registration failures" value={overview.registrationFailures} detail="Failed registrar registrations" icon="error" />
                    <MetricCard label="Payment exceptions" value={overview.paymentExceptions} detail="Failed payments or refunds" icon="payments" />
                    <MetricCard label="Renewals due" value={overview.renewalsDue} detail="Due in the next 30 days" icon="event_repeat" />
                    <MetricCard label="Support tickets" value={overview.supportTickets} detail="Open or in progress" icon="support_agent" />
                    <MetricCard label="Customers" value={overview.users.customers} detail={`${overview.users.admins} administrators`} icon="group" />
                    <MetricCard label="Healthy integrations" value={integrations.filter((item) => item.healthy).length} detail={`of ${integrations.length} configured services`} icon="hub" />
                    <MetricCard label="Domains" value={overview.domains} detail="Domain records in MongoDB" icon="language" />
                  </div>
                  <section className="overflow-hidden rounded-2xl border border-[#e5ece6] bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-[#edf1ed] px-5 py-4">
                      <div>
                        <h2 className="font-heading text-base font-bold">Recently registered users</h2>
                        <p className="mt-1 text-xs text-[#879188]">Latest customer and administrator accounts</p>
                      </div>
                      <button type="button" onClick={() => navigateToSection("customers")} className="text-xs font-semibold text-[#176b4d] hover:underline">View all users</button>
                    </div>
                    {loading && users.users.length === 0 ? (
                      <div className="px-5 py-10 text-center text-sm text-[#68766d]">Loading users...</div>
                    ) : (
                      <UserTable users={users.users} currentUid={currentUid} updatingUid={updatingUid} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} />
                    )}
                  </section>
                </div>
              )}

              {section === "customers" && (
                <section className="overflow-hidden rounded-2xl border border-[#e5ece6] bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-[#edf1ed] px-5 py-4 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="font-heading text-base font-bold">All registered users</h2>
                      <p className="mt-1 text-xs text-[#879188]">{users.total.toLocaleString()} account{users.total === 1 ? "" : "s"} in MongoDB · Change customer/admin access</p>
                    </div>
                    <label className="relative block w-full sm:max-w-xs">
                      <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#879188]" />
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setPage(1);
                        }}
                        placeholder="Search name, email or user ID"
                        className="min-h-10 w-full rounded-xl border border-[#dfe8e0] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10"
                      />
                    </label>
                  </div>
                  {loading && users.users.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-[#68766d]">Loading users...</div>
                  ) : (
                    <UserTable users={users.users} currentUid={currentUid} updatingUid={updatingUid} onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} />
                  )}
                  <div className="flex items-center justify-between gap-3 border-t border-[#edf1ed] px-5 py-4">
                    <p className="text-xs text-[#879188]">
                      {users.total === 0 ? "No accounts" : `Showing ${(users.page - 1) * users.limit + 1}–${Math.min(users.page * users.limit, users.total)} of ${users.total} users`}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="min-h-9 rounded-lg border border-[#dfe8e0] px-3 text-xs font-semibold text-[#526258] disabled:opacity-40">Previous</button>
                      <button type="button" onClick={() => setPage((value) => value + 1)} disabled={page * users.limit >= users.total || loading} className="min-h-9 rounded-lg border border-[#dfe8e0] px-3 text-xs font-semibold text-[#526258] disabled:opacity-40">Next</button>
                    </div>
                  </div>
                </section>
              )}

              {section === "orders" && (
                <section className="overflow-hidden rounded-2xl border border-[#e5ece6] bg-white shadow-sm">
                  <div className="border-b border-[#edf1ed] px-5 py-4">
                    <h2 className="font-heading text-base font-bold">Order and payment operations</h2>
                    <p className="mt-1 text-xs leading-5 text-[#879188]">Provider references are shown for support. Retry and refund actions stay disabled until a provider is safely connected.</p>
                  </div>
                  {orders.orders.length === 0 && !loading ? (
                    <div className="px-5 py-12 text-center text-sm text-[#68766d]">No orders are stored in MongoDB yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1050px] text-left text-xs">
                        <thead className="bg-[#f8faf8] text-[10px] font-bold uppercase tracking-wide text-[#879188]"><tr><th className="px-4 py-3">Order / domain</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Statuses</th><th className="px-4 py-3">Payment reference</th><th className="px-4 py-3">Registrar reference</th><th className="px-4 py-3">Refund</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Safe retry</th></tr></thead>
                        <tbody className="divide-y divide-[#edf1ed]">
                          {orders.orders.map((order) => (
                            <tr key={order.id}>
                              <td className="px-4 py-4"><p className="font-semibold text-[#344b3b]">{order.orderNumber || order.id}</p><p className="mt-1 text-[#879188]">{order.domain || "Domain not specified"}</p><p className="mt-1 font-semibold text-[#176b4d]">{order.amount === undefined ? "—" : `${order.amount} ${order.currency || ""}`}</p></td>
                              <td className="px-4 py-4 text-[#526258]">{order.customerEmail || "—"}</td>
                              <td className="px-4 py-4"><p>Order: {order.status || "—"}</p><p className="mt-1">Payment: {order.paymentStatus || "—"}</p><p className="mt-1">Registration: {order.registrationStatus || "—"}</p></td>
                              <td className="max-w-40 break-all px-4 py-4 text-[#68766d]">{order.paymentReference || "—"}</td>
                              <td className="max-w-40 break-all px-4 py-4 text-[#68766d]">{order.registrarReference || "—"}</td>
                              <td className="px-4 py-4 text-[#526258]">{order.refundStatus || "Not requested"}</td>
                              <td className="px-4 py-4 text-[#68766d]">{formatDate(order.createdAt)}</td>
                              <td className="px-4 py-4"><button type="button" disabled title="Connect and validate a payment or registrar provider before retrying." className="min-h-8 rounded-lg border border-[#e5ece6] px-2.5 text-[10px] font-semibold text-[#879188] disabled:cursor-not-allowed">Unavailable</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Pagination page={orders.page} limit={orders.limit} total={orders.total} loading={loading} onChange={setPage} />
                </section>
              )}

              {section === "domains" && (
                <section className="overflow-hidden rounded-2xl border border-[#e5ece6] bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-[#edf1ed] px-5 py-4 sm:flex-row sm:items-center">
                    <div><h2 className="font-heading text-base font-bold">Domain registry</h2><p className="mt-1 text-xs text-[#879188]">Search ownership, expiry, status, and provider references.</p></div>
                    <label className="relative block w-full sm:max-w-xs"><MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#879188]" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Domain, owner, provider ID" className="min-h-10 w-full rounded-xl border border-[#dfe8e0] pl-10 pr-3 text-sm outline-none focus:border-[#91b99c] focus:ring-4 focus:ring-[#176b4d]/10" /></label>
                  </div>
                  {domains.domains.length === 0 && !loading ? <div className="px-5 py-12 text-center text-sm text-[#68766d]">No domain records are stored in MongoDB yet.</div> : (
                    <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs">
                      <thead className="bg-[#f8faf8] text-[10px] font-bold uppercase tracking-wide text-[#879188]"><tr><th className="px-5 py-3">Domain</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Expiry</th><th className="px-5 py-3">Provider</th><th className="px-5 py-3">Provider reference</th></tr></thead>
                      <tbody className="divide-y divide-[#edf1ed]">{domains.domains.map((domain) => <tr key={domain.id}><td className="px-5 py-4 font-semibold text-[#344b3b]">{domain.domain || domain.name || "—"}</td><td className="px-5 py-4 text-[#526258]">{domain.ownerEmail || domain.ownerUid || "—"}</td><td className="px-5 py-4">{domain.status || "—"}</td><td className="px-5 py-4">{formatDate(domain.expiresAt)}</td><td className="px-5 py-4">{domain.provider || "—"}</td><td className="max-w-48 break-all px-5 py-4 text-[#68766d]">{domain.providerReference || "—"}</td></tr>)}</tbody>
                    </table></div>
                  )}
                  <Pagination page={domains.page} limit={domains.limit} total={domains.total} loading={loading} onChange={setPage} />
                </section>
              )}

              {section === "pricing" && (
                <section className="overflow-hidden rounded-2xl border border-[#e5ece6] bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-[#edf1ed] px-5 py-4">
                    <div><h2 className="font-heading text-base font-bold">TLD pricing</h2><p className="mt-1 text-xs text-[#879188]">Set prices, currency, enabled state, and effective period.</p></div>
                    <button type="button" onClick={() => startPricingForm()} className="glass-button inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-white"><MaterialIcon name="add" /> Add TLD pricing</button>
                  </div>
                  {pricingForm && (
                    <form onSubmit={handleSavePricing} className="grid gap-4 border-b border-[#edf1ed] bg-[#f8faf8] p-5 sm:grid-cols-2 xl:grid-cols-4">
                      <label className="text-xs font-semibold text-[#526258]">TLD<input required pattern="\\.[A-Za-z0-9-]{2,63}" placeholder=".com" value={pricingForm.tld} onChange={(event) => setPricingForm({ ...pricingForm, tld: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-[#dfe8e0] bg-white px-3 text-sm" /></label>
                      <label className="text-xs font-semibold text-[#526258]">Currency<input required maxLength={3} pattern="[A-Za-z]{3}" value={pricingForm.currency} onChange={(event) => setPricingForm({ ...pricingForm, currency: event.target.value.toUpperCase() })} className="mt-1 min-h-10 w-full rounded-lg border border-[#dfe8e0] bg-white px-3 text-sm" /></label>
                      <label className="text-xs font-semibold text-[#526258]">Registration price<input type="number" min="0" step="0.01" required value={pricingForm.registrationPrice} onChange={(event) => setPricingForm({ ...pricingForm, registrationPrice: Number(event.target.value) })} className="mt-1 min-h-10 w-full rounded-lg border border-[#dfe8e0] bg-white px-3 text-sm" /></label>
                      <label className="text-xs font-semibold text-[#526258]">Renewal price<input type="number" min="0" step="0.01" required value={pricingForm.renewalPrice} onChange={(event) => setPricingForm({ ...pricingForm, renewalPrice: Number(event.target.value) })} className="mt-1 min-h-10 w-full rounded-lg border border-[#dfe8e0] bg-white px-3 text-sm" /></label>
                      <label className="text-xs font-semibold text-[#526258]">Transfer price<input type="number" min="0" step="0.01" required value={pricingForm.transferPrice} onChange={(event) => setPricingForm({ ...pricingForm, transferPrice: Number(event.target.value) })} className="mt-1 min-h-10 w-full rounded-lg border border-[#dfe8e0] bg-white px-3 text-sm" /></label>
                      <label className="text-xs font-semibold text-[#526258]">Effective from<input type="date" required value={pricingForm.effectiveFrom} onChange={(event) => setPricingForm({ ...pricingForm, effectiveFrom: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-[#dfe8e0] bg-white px-3 text-sm" /></label>
                      <label className="text-xs font-semibold text-[#526258]">Effective to (optional)<input type="date" value={pricingForm.effectiveTo} onChange={(event) => setPricingForm({ ...pricingForm, effectiveTo: event.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-[#dfe8e0] bg-white px-3 text-sm" /></label>
                      <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-[#526258]"><input type="checkbox" checked={pricingForm.enabled} onChange={(event) => setPricingForm({ ...pricingForm, enabled: event.target.checked })} /> Enabled for sales</label>
                      <div className="flex gap-2 sm:col-span-2 xl:col-span-4"><button type="submit" disabled={updatingUid !== null} className="glass-button min-h-10 rounded-xl px-4 text-xs font-semibold text-white disabled:opacity-50">{updatingUid ? "Saving..." : "Save pricing"}</button><button type="button" onClick={() => setPricingForm(null)} className="min-h-10 rounded-xl border border-[#dfe8e0] px-4 text-xs font-semibold text-[#526258]">Cancel</button></div>
                    </form>
                  )}
                  {pricing.length === 0 && !loading ? <div className="px-5 py-12 text-center text-sm text-[#68766d]">No TLD pricing configured yet.</div> : (
                    <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#f8faf8] text-[10px] font-bold uppercase tracking-wide text-[#879188]"><tr><th className="px-5 py-3">TLD</th><th className="px-5 py-3">Registration</th><th className="px-5 py-3">Renewal</th><th className="px-5 py-3">Transfer</th><th className="px-5 py-3">Effective period</th><th className="px-5 py-3">Enabled</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y divide-[#edf1ed]">{pricing.map((record) => <tr key={record.id}><td className="px-5 py-4 font-bold text-[#344b3b]">{record.tld}</td><td className="px-5 py-4">{record.registrationPrice} {record.currency}</td><td className="px-5 py-4">{record.renewalPrice} {record.currency}</td><td className="px-5 py-4">{record.transferPrice} {record.currency}</td><td className="px-5 py-4">{formatDate(record.effectiveFrom)} – {record.effectiveTo ? formatDate(record.effectiveTo) : "No end date"}</td><td className="px-5 py-4">{record.enabled ? "Enabled" : "Disabled"}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => startPricingForm(record)} className="glass-button-light min-h-8 rounded-lg px-3 text-xs font-semibold text-[#176b4d]">Edit</button></td></tr>)}</tbody></table></div>
                  )}
                </section>
              )}

              {section === "support" && (
                <section className="overflow-hidden rounded-2xl border border-[#e5ece6] bg-white shadow-sm">
                  <div className="border-b border-[#edf1ed] px-5 py-4"><h2 className="font-heading text-base font-bold">Support tickets</h2><p className="mt-1 text-xs text-[#879188]">Internal notes are kept separate from customer-visible replies.</p></div>
                  {support.tickets.length === 0 && !loading ? <div className="px-5 py-12 text-center text-sm text-[#68766d]">No support tickets are stored yet.</div> : (
                    <div className="divide-y divide-[#edf1ed]">{support.tickets.map((ticket) => <article key={ticket.id} className="p-5">
                      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start"><div className="min-w-0"><p className="font-semibold text-[#344b3b]">{ticket.subject || `Ticket ${ticket.id}`}</p><p className="mt-1 text-xs text-[#879188]">{ticket.customerEmail || ticket.customerUid || "Customer unknown"} · {formatDate(ticket.createdAt)}</p>{ticket.message && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#526258]">{ticket.message}</p>}</div>
                        <div className="grid shrink-0 gap-2 sm:grid-cols-3">
                          <label className="text-[10px] font-semibold text-[#879188]">Status<select value={ticket.status || "open"} disabled={updatingUid === ticket.id} onChange={(event) => void updateSupportTicket(ticket, { status: event.target.value })} className="mt-1 min-h-9 rounded-lg border border-[#dfe8e0] bg-white px-2 text-xs text-[#344b3b]"><option value="open">Open</option><option value="in_progress">In progress</option><option value="waiting_customer">Waiting customer</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label>
                          <label className="text-[10px] font-semibold text-[#879188]">Priority<select value={ticket.priority || "normal"} disabled={updatingUid === ticket.id} onChange={(event) => void updateSupportTicket(ticket, { priority: event.target.value })} className="mt-1 min-h-9 rounded-lg border border-[#dfe8e0] bg-white px-2 text-xs text-[#344b3b]"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
                          <label className="text-[10px] font-semibold text-[#879188]">Assignee<input key={`${ticket.id}-${ticket.assignee || ""}`} defaultValue={ticket.assignee || ""} onBlur={(event) => { if (event.target.value !== (ticket.assignee || "")) void updateSupportTicket(ticket, { assignee: event.target.value }); }} placeholder="Email or blank" className="mt-1 min-h-9 w-36 rounded-lg border border-[#dfe8e0] px-2 text-xs text-[#344b3b]" /></label>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => addTicketNote(ticket, "internalNote")} className="min-h-9 rounded-lg border border-[#dfe8e0] px-3 text-xs font-semibold text-[#526258]">Add internal note</button><button type="button" onClick={() => addTicketNote(ticket, "customerReply")} className="glass-button-light min-h-9 rounded-lg px-3 text-xs font-semibold text-[#176b4d]">Write customer-visible reply</button><span className="self-center text-[10px] text-[#879188]">{ticket.internalNotes?.length || 0} internal notes · {ticket.customerReplies?.length || 0} saved replies</span></div>
                      {Boolean(ticket.internalNotes?.length) && <div className="mt-3 rounded-xl border border-[#f2e4c9] bg-[#fffaf0] p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a6a2f]">Internal notes · admin only</p>{ticket.internalNotes?.slice(-2).map((note, index) => <p key={`${ticket.id}-internal-${index}`} className="mt-2 text-xs leading-5 text-[#67583c]"><span className="font-semibold">{note.actorEmail}</span> · {formatDate(note.createdAt)}<br />{note.message}</p>)}</div>}
                      {Boolean(ticket.customerReplies?.length) && <div className="mt-3 rounded-xl border border-[#dce9dd] bg-[#f7fbf6] p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#176b4d]">Customer-visible replies · saved, not emailed</p>{ticket.customerReplies?.slice(-2).map((reply, index) => <p key={`${ticket.id}-reply-${index}`} className="mt-2 text-xs leading-5 text-[#526258]"><span className="font-semibold">{reply.actorEmail}</span> · {formatDate(reply.createdAt)}<br />{reply.message}</p>)}</div>}
                    </article>)}</div>
                  )}
                  <Pagination page={support.page} limit={support.limit} total={support.total} loading={loading} onChange={setPage} />
                </section>
              )}

              {section === "integrations" && (
                <section className="overflow-hidden rounded-2xl border border-[#e5ece6] bg-white shadow-sm">
                  <div className="border-b border-[#edf1ed] px-5 py-4"><h2 className="font-heading text-base font-bold">Integration health</h2><p className="mt-1 text-xs text-[#879188]">Only configuration and health state is shown; secret values are never returned.</p></div>
                  <div className="divide-y divide-[#edf1ed]">{integrations.map((integration) => <div key={integration.name} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${integration.healthy ? "bg-[#eaf6ed] text-[#23834b]" : integration.configured ? "bg-[#fff4e5] text-[#9a6a20]" : "bg-[#f2f4f2] text-[#879188]"}`}><MaterialIcon name={integration.healthy ? "check_circle" : integration.configured ? "warning" : "link_off"} /></span><div><p className="text-sm font-semibold text-[#344b3b]">{integration.name}</p><p className="mt-1 text-xs text-[#879188]">{integration.detail}</p></div></div><span className={`self-start rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide sm:self-auto ${integration.healthy ? "bg-[#edf6ee] text-[#176b4d]" : integration.configured ? "bg-[#fff4e5] text-[#9a6a20]" : "bg-[#f2f4f2] text-[#68766d]"}`}>{integration.healthy ? "Healthy" : integration.configured ? "Configured" : "Not configured"}</span></div>)}</div>
                </section>
              )}

              {section === "audit" && (
                <section className="overflow-hidden rounded-2xl border border-[#e5ece6] bg-white shadow-sm">
                  <div className="border-b border-[#edf1ed] px-5 py-4"><h2 className="font-heading text-base font-bold">Audit log</h2><p className="mt-1 text-xs text-[#879188]">Admin actions with actor, timestamp, outcome, and sanitized metadata.</p></div>
                  {auditEntries.entries.length === 0 && !loading ? <div className="px-5 py-12 text-center text-sm text-[#68766d]">No admin actions have been logged.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-[#f8faf8] text-[10px] font-bold uppercase tracking-wide text-[#879188]"><tr><th className="px-5 py-3">When</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">Outcome</th><th className="px-5 py-3">Safe metadata</th></tr></thead><tbody className="divide-y divide-[#edf1ed]">{auditEntries.entries.map((entry) => <tr key={entry.id}><td className="whitespace-nowrap px-5 py-4">{new Date(entry.createdAt).toLocaleString()}</td><td className="px-5 py-4">{entry.actorEmail || entry.actorUid}</td><td className="px-5 py-4 font-semibold text-[#344b3b]">{entry.action}</td><td className="px-5 py-4">{entry.targetType}: {entry.targetId}</td><td className={`px-5 py-4 font-semibold ${entry.outcome === "success" ? "text-[#21834b]" : "text-[#a64132]"}`}>{entry.outcome}</td><td className="max-w-64 break-words px-5 py-4 text-[#68766d]">{Object.entries(entry.metadata || {}).map(([key, value]) => `${key}: ${String(value)}`).join(" · ") || "—"}</td></tr>)}</tbody></table></div>}
                  <Pagination page={auditEntries.page} limit={auditEntries.limit} total={auditEntries.total} loading={loading} onChange={setPage} />
                </section>
              )}

              <p className="mt-6 text-center text-[11px] text-[#98a198]">
                Admin actions are verified by the Express API against the MongoDB role on every request.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
