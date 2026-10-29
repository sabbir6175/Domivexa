import { DemoNotice, PublicPage } from "@/components/marketing/public-page";

const prices = [
  { tld: ".com", registration: "$9.99" },
  { tld: ".net", registration: "$11.99" },
  { tld: ".org", registration: "$8.99" },
  { tld: ".dev", registration: "$12.99" },
];

export const metadata = {
  title: "Pricing | Domivexa",
  description: "Review illustrative domain pricing and learn what is not yet configured.",
};

export default function PricingPage() {
  return (
    <PublicPage
      eyebrow="Clear pricing"
      title="Know what to expect before you register."
      intro="We want pricing to be straightforward. Provider rates, taxes, and renewal terms are not yet configured for this preview."
    >
      <div className="space-y-7">
        <DemoNotice>
          All prices shown are illustrative placeholders from the design. They are
          not live quotes or offers. Renewal, transfer, tax, and add-on amounts have
          not been supplied by a provider.
        </DemoNotice>
        <div className="overflow-x-auto rounded-2xl border border-[#e7ece7] bg-white">
          <table className="w-full min-w-[560px] text-left">
            <thead className="bg-[#f7faf7] text-xs font-semibold text-[#68766d]">
              <tr>
                <th scope="col" className="px-5 py-4 sm:px-7">Extension</th>
                <th scope="col" className="px-5 py-4 sm:px-7">Sample first-year price</th>
                <th scope="col" className="px-5 py-4 sm:px-7">Renewal / transfer</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr key={price.tld} className="border-t border-[#edf1ed] text-sm">
                  <th scope="row" className="px-5 py-4 font-heading text-lg font-bold sm:px-7">{price.tld}</th>
                  <td className="px-5 py-4 text-[#526258] sm:px-7">{price.registration} <span className="text-xs text-[#879188]">(sample only)</span></td>
                  <td className="px-5 py-4 text-[#718078] sm:px-7">Not configured</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-6 text-[#718078]">
          Final pricing must come from the selected registrar and include applicable
          taxes, renewal rates, terms, and any fees before checkout is enabled.
        </p>
      </div>
    </PublicPage>
  );
}
