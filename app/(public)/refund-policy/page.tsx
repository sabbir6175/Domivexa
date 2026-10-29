import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = { title: "Refund policy | Domivexa" };

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund and cancellation policy"
      intro="Refund and cancellation rules depend on the business, provider, registry, payment gateway, and applicable law."
      sections={[
        {
          title: "No transactions in this preview",
          body: "The Domivexa preview does not accept payment or submit registration requests. No purchase or refund can be made through this website.",
        },
        {
          title: "Registration outcomes",
          body: "Before launch, the policy must explain what happens when payment succeeds but a domain cannot be registered, a provider request is pending, or registrant information is rejected.",
        },
        {
          title: "Renewals and cancellations",
          body: "The business must document renewal notices, auto-renewal authorization and cancellation timing, expiration rules, and any provider restrictions.",
        },
        {
          title: "Refund eligibility and timing",
          body: "Specific eligibility, timelines, fees, payment method, and legal exceptions require review against the selected providers and applicable consumer laws.",
        },
      ]}
    />
  );
}
