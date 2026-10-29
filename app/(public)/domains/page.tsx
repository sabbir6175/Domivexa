import Link from "next/link";
import { DemoNotice, PrimaryLink, PublicPage, SectionCard } from "@/components/marketing/public-page";

const extensions = [
  { name: ".com", price: "$9.99", purpose: "A familiar choice for businesses, creators, and personal sites." },
  { name: ".net", price: "$11.99", purpose: "A flexible option for technology and network projects." },
  { name: ".org", price: "$8.99", purpose: "A recognizable fit for communities and organizations." },
  { name: ".dev", price: "$12.99", purpose: "A distinct address for developers and software projects." },
];

export const metadata = {
  title: "Domains | Domivexa",
  description: "Explore supported domain extensions and domain management features.",
};

export default function DomainsPage() {
  return (
    <PublicPage
      eyebrow="Domain names"
      title="A good name is a great place to start."
      intro="Explore familiar domain endings and learn what to expect when you choose a name for your next idea."
    >
      <div className="space-y-10">
        <DemoNotice>
          Extension prices below are illustrative design values only. Live availability,
          registration terms, and provider pricing are not connected or verified.
        </DemoNotice>

        <section aria-label="Domain extensions" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {extensions.map((extension) => (
            <article key={extension.name} className="rounded-2xl border border-[#e7ece7] bg-white p-6 shadow-sm">
              <p className="font-heading text-3xl font-bold">{extension.name}</p>
              <p className="mt-3 min-h-14 text-sm leading-6 text-[#66736a]">{extension.purpose}</p>
              <p className="mt-5 border-t border-[#edf1ed] pt-4 text-xs text-[#7d8980]">
                Illustrative only: <strong className="text-base text-[#172b22]">{extension.price}</strong> / first year
              </p>
              <Link href={`/search?q=${encodeURIComponent(`yourname${extension.name}`)}`} className="glass-button-light mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#176b4d]">
                Explore {extension.name}
              </Link>
            </article>
          ))}
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <SectionCard icon="language" title="Choose your name">
            Search an idea, a business name, or a full domain. Availability must be checked with a connected registrar.
          </SectionCard>
          <SectionCard icon="dns" title="Manage the details">
            A future customer portal can bring renewal information, DNS, and nameservers together.
          </SectionCard>
          <SectionCard icon="support_agent" title="Get help when needed">
            Browse the help center or contact the team while the service is being prepared.
          </SectionCard>
        </section>

        <div className="flex flex-wrap gap-3">
          <PrimaryLink href="/search">Search a domain</PrimaryLink>
          <Link href="/pricing" className="glass-button-light inline-flex items-center rounded-xl px-5 py-3.5 text-sm font-semibold text-[#176b4d]">
            View pricing details
          </Link>
        </div>
      </div>
    </PublicPage>
  );
}
