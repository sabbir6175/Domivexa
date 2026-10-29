import { DemoNotice, PublicPage, SectionCard } from "@/components/marketing/public-page";

export const metadata = {
  title: "About | Domivexa",
  description: "Learn about the Domivexa domain platform preview.",
};

export default function AboutPage() {
  return (
    <PublicPage
      eyebrow="About Domivexa"
      title="A calmer way to manage your online home."
      intro="Domivexa is being designed to make it easier to find a domain, understand the next steps, and manage the details in one place."
    >
      <div className="space-y-8">
        <DemoNotice>
          Domivexa is currently a website preview, not a live domain registration
          business. Provider services, customer accounts, and transaction processing
          are not yet connected.
        </DemoNotice>
        <div className="grid gap-5 md:grid-cols-3">
          <SectionCard icon="search" title="Start with a name">
            Explore domain ideas and extensions with clear information about what is sample and what still needs a provider check.
          </SectionCard>
          <SectionCard icon="manage_accounts" title="Keep things organized">
            The planned customer portal brings domain, renewal, DNS, and order details into a single dashboard.
          </SectionCard>
          <SectionCard icon="verified_user" title="Build with care">
            Account security, accurate provider data, and transparent pricing are planned requirements before live service.
          </SectionCard>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-[#59685e]">
          The platform will only present registration status, pricing, renewal dates, and
          DNS values as live once those values are supplied and confirmed by the selected
          service providers.
        </p>
      </div>
    </PublicPage>
  );
}
