import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = { title: "Privacy policy | Domivexa" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="This draft outlines privacy topics that must be completed before collecting real customer information."
      sections={[
        {
          title: "Information collected",
          body: "The final policy must list the account, contact, registrant, billing, support, and technical information actually collected, and explain which information is required.",
        },
        {
          title: "How information is used and shared",
          body: "Explain the purposes for processing data and which registrar, payment, email, hosting, or support providers receive it to deliver the service.",
        },
        {
          title: "Retention and security",
          body: "Document retention periods, access controls, security measures, incident handling, and how customers can request access, correction, or deletion where applicable.",
        },
        {
          title: "Cookies, jurisdiction, and contact",
          body: "Identify cookies and analytics in use, applicable legal jurisdiction, privacy rights, and the real privacy contact before this policy is published as final.",
        },
      ]}
    />
  );
}
