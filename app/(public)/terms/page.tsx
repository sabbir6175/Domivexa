import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = { title: "Terms of service | Domivexa" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro="This draft explains topics the final service terms should cover."
      sections={[
        {
          title: "Preview service",
          body: "This website is currently a design and functionality preview. It does not accept domain registrations, process payments, manage DNS, or create customer accounts.",
        },
        {
          title: "Domain registration and provider terms",
          body: "Before launch, the terms must describe the selected registrar, registration and renewal conditions, eligibility, transfers, expiration, and any registry-specific requirements.",
        },
        {
          title: "Pricing and payment",
          body: "Final terms must explain currency, taxes, renewal rates, payment timing, refunds, failed registrations, and how payment and registration status are communicated.",
        },
        {
          title: "Acceptable use and support",
          body: "The operating business must define acceptable use, account responsibilities, support channels, service availability, and complaint processes.",
        },
      ]}
    />
  );
}
