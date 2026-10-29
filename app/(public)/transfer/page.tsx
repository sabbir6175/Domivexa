import { DemoNotice, PrimaryLink, PublicPage, SectionCard } from "@/components/marketing/public-page";

export const metadata = {
  title: "Transfer a domain | Domivexa",
  description: "Learn what to prepare before transferring a domain to Domivexa.",
};

const steps = [
  {
    number: "01",
    title: "Check transfer eligibility",
    text: "Confirm the domain extension and registration date meet the current registrar's transfer rules.",
  },
  {
    number: "02",
    title: "Prepare your current registrar account",
    text: "Unlock the domain and request its authorization code from the company that currently manages it.",
  },
  {
    number: "03",
    title: "Review contacts and DNS",
    text: "Make sure registrant details are current and keep a copy of existing DNS records before making changes.",
  },
  {
    number: "04",
    title: "Submit the transfer when supported",
    text: "A future transfer flow will confirm provider support, price, timing, and any required approval before submission.",
  },
];

export default function TransferPage() {
  return (
    <PublicPage
      eyebrow="Domain transfers"
      title="Bring your domains together."
      intro="A domain transfer moves management from one registrar to another. A little preparation helps keep your website and email working."
    >
      <div className="space-y-8">
        <DemoNotice>
          Transfers are informational only in this preview. No registrar is connected,
          so you cannot submit or complete a transfer here.
        </DemoNotice>
        <ol className="grid gap-5 md:grid-cols-2">
          {steps.map((step) => (
            <li key={step.number} className="rounded-2xl border border-[#e7ece7] bg-white p-6">
              <span className="text-xs font-bold tracking-[0.14em] text-[#25865e]">{step.number}</span>
              <h2 className="mt-3 font-heading text-lg font-bold">{step.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#59685e]">{step.text}</p>
            </li>
          ))}
        </ol>
        <SectionCard icon="warning" title="Avoid unexpected downtime">
          A transfer does not always move DNS hosting automatically. Record your current
          nameservers and DNS entries, and do not cancel your existing service until the
          transfer and website/email setup are confirmed.
        </SectionCard>
        <PrimaryLink href="/help/domain-transfer">Read the transfer guide</PrimaryLink>
      </div>
    </PublicPage>
  );
}
