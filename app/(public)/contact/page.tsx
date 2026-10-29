import { ContactForm } from "@/components/marketing/contact-form";
import { DemoNotice, PublicPage } from "@/components/marketing/public-page";

export const metadata = {
  title: "Contact | Domivexa",
  description: "Contact the Domivexa team about domains and the platform preview.",
};

export default function ContactPage() {
  return (
    <PublicPage
      eyebrow="Contact"
      title="How can we help?"
      intro="Send a question about domains, transfers, or the Domivexa preview."
    >
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <section className="rounded-2xl border border-[#e7ece7] bg-white p-6 sm:p-8">
          <h2 className="mb-6 font-heading text-xl font-bold">Send us a message</h2>
          <ContactForm />
        </section>
        <aside className="space-y-5">
          <DemoNotice>
            The contact form is a frontend preview and does not send or store your
            message. A support address and secure server endpoint are not configured.
          </DemoNotice>
          <div className="rounded-2xl border border-[#e7ece7] bg-white p-6">
            <h2 className="font-heading text-lg font-bold">Support details</h2>
            <p className="mt-3 text-sm leading-7 text-[#59685e]">
              The official support mailbox and response hours will be published here
              after the business contact details are confirmed.
            </p>
          </div>
        </aside>
      </div>
    </PublicPage>
  );
}
