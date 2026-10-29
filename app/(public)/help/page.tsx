import Link from "next/link";
import { DemoNotice, PublicPage } from "@/components/marketing/public-page";

const articles = [
  {
    href: "/help/domain-basics",
    icon: "language",
    title: "Domain name basics",
    description: "Learn about domain names, extensions, and registration terms.",
  },
  {
    href: "/help/domain-transfer",
    icon: "swap_horiz",
    title: "Preparing a domain transfer",
    description: "Understand transfer locks, authorization codes, and DNS continuity.",
  },
  {
    href: "/help/dns-basics",
    icon: "dns",
    title: "DNS and website connections",
    description: "A simple overview of DNS records and website/email settings.",
  },
];

export const metadata = {
  title: "Help center | Domivexa",
  description: "Browse introductory help articles about domains and DNS.",
};

export default function HelpPage() {
  return (
    <PublicPage
      eyebrow="Help center"
      title="A little guidance goes a long way."
      intro="Start with the basics of domain names, transfers, and DNS. These guides are general information for the website preview."
    >
      <div className="space-y-7">
        <DemoNotice>
          Help articles are general educational content. Provider-specific tools,
          instructions, and support ticket handling are not connected yet.
        </DemoNotice>
        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.href} href={article.href} className="group rounded-2xl border border-[#e7ece7] bg-white p-6 transition hover:-translate-y-1 hover:border-[#b8d6c0] hover:shadow-lg">
              <span aria-hidden="true" className="material-symbols-rounded flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf4eb] text-[#218259]">{article.icon}</span>
              <h2 className="mt-5 font-heading text-lg font-bold">{article.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#59685e]">{article.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#176b4d]">
                Read guide <span aria-hidden="true" className="material-symbols-rounded text-base">arrow_forward</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </PublicPage>
  );
}
