import { notFound } from "next/navigation";
import { DemoNotice, PublicPage } from "@/components/marketing/public-page";

const articles = {
  "domain-basics": {
    title: "Domain name basics",
    intro: "A domain name is the human-readable address people use to find a website.",
    sections: [
      ["Name and extension", "The name is the part you choose; the extension (such as .com or .org) is the ending. Availability and eligibility depend on the registrar and registry."],
      ["Registration and renewal", "A domain is registered for a set term. Renewal pricing and timing can differ from the first-year price, so review the provider's terms before purchase."],
      ["Registrant details", "Accurate contact information may be required by the registrar. Store and share only the information needed for registration."],
    ],
  },
  "domain-transfer": {
    title: "Preparing a domain transfer",
    intro: "Transfers follow rules set by the current registrar, the receiving registrar, and the domain extension.",
    sections: [
      ["Check eligibility", "Some domains cannot be transferred shortly after registration or a previous transfer. Verify the current extension-specific rules."],
      ["Unlock and request a code", "When eligible, unlock the domain and request its transfer authorization code from the current registrar. Keep this code private."],
      ["Protect your services", "Record your current nameservers and DNS records. Keep existing services active until the transfer is complete and verified."],
    ],
  },
  "dns-basics": {
    title: "DNS and website connections",
    intro: "DNS records connect a domain name to services such as a website or email provider.",
    sections: [
      ["Common records", "A and AAAA records point a hostname to IP addresses; CNAME points to another hostname; MX describes mail routing; TXT is often used for verification."],
      ["Use provider-supplied values", "Hosts provide the exact record names and values for their service. Sample values should never be treated as universal instructions."],
      ["Allow time for changes", "DNS updates can take time to appear consistently. Do not claim propagation is complete unless an actual check confirms it."],
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/help/[slug]">) {
  const { slug } = await params;
  const article = articles[slug as keyof typeof articles];
  return { title: article ? `${article.title} | Domivexa Help` : "Help | Domivexa" };
}

export default async function HelpArticlePage({
  params,
}: PageProps<"/help/[slug]">) {
  const { slug } = await params;
  const article = articles[slug as keyof typeof articles];

  if (!article) notFound();

  return (
    <PublicPage eyebrow="Help center" title={article.title} intro={article.intro}>
      <div className="mx-auto max-w-3xl space-y-7">
        <DemoNotice>
          General information only. Current registrar rules and provider requirements
          may differ; verify instructions with the relevant provider.
        </DemoNotice>
        {article.sections.map(([title, text]) => (
          <section key={title} className="border-b border-[#e7ece7] pb-6 last:border-0">
            <h2 className="font-heading text-xl font-bold">{title}</h2>
            <p className="mt-3 leading-7 text-[#59685e]">{text}</p>
          </section>
        ))}
      </div>
    </PublicPage>
  );
}
