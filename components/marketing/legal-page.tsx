import { DemoNotice, PublicPage } from "@/components/marketing/public-page";

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
}) {
  return (
    <PublicPage eyebrow="Legal information" title={title} intro={intro}>
      <div className="mx-auto max-w-3xl space-y-8">
        <DemoNotice>
          Draft preview only—not an operative policy or legal advice. The final document
          must be reviewed for the actual legal entity, jurisdiction, registrar,
          payment provider, data handling, and business rules before launch.
        </DemoNotice>
        {sections.map((section) => (
          <section key={section.title} className="border-b border-[#e7ece7] pb-6 last:border-0">
            <h2 className="font-heading text-lg font-bold">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#59685e]">{section.body}</p>
          </section>
        ))}
      </div>
    </PublicPage>
  );
}
