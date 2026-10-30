import { DemoNotice, PublicPage } from "@/components/marketing/public-page";
import { PublishedPricingTable } from "@/components/marketing/published-pricing-table";

export const metadata = {
  title: "Pricing | Domivexa",
  description: "Review current configured TLD prices and learn what is not yet connected.",
};

export default function PricingPage() {
  return (
    <PublicPage
      eyebrow="Clear pricing"
      title="Know what to expect before you register."
      intro="Current prices configured by Domivexa are listed below. Final checkout quotes may depend on provider availability and applicable taxes."
    >
      <div className="space-y-7">
        <DemoNotice>
          These are configured base prices, not a live registrar quote. Checkout,
          taxes, provider fees, and domain registration are not connected yet.
        </DemoNotice>
        <PublishedPricingTable />
        <p className="text-xs leading-6 text-[#718078]">
          Final pricing must come from the selected registrar and include applicable
          taxes, renewal rates, terms, and any fees before checkout is enabled.
        </p>
      </div>
    </PublicPage>
  );
}
