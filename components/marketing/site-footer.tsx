import Link from "next/link";

const linkGroups = [
  {
    title: "Domains",
    links: [
      { label: "Search domains", href: "/search" },
      { label: "Domain extensions", href: "/domains" },
      { label: "Transfer a domain", href: "/transfer" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Customer dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Refund policy", href: "/refund-policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#10271d] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25865e] text-xl font-bold">
                D
              </span>
              <span className="font-heading text-2xl font-bold">
                Domi<span className="text-[#7bd4a3]">vexa</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#b7c9bd]">
              Domains made simple. This preview uses sample data and is not connected to a live registrar.
            </p>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold">{group.title}</h2>
              <div className="mt-5 space-y-3 text-sm text-[#b7c9bd]">
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="block transition-colors hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-[#b7c9bd] sm:flex-row sm:items-center sm:justify-between">
          <p>Domivexa. All rights reserved.</p>
          <p>Sample website preview — not a live domain service.</p>
        </div>
      </div>
    </footer>
  );
}
