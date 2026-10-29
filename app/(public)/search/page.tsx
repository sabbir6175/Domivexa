import { Suspense } from "react";
import Link from "next/link";
import { DemoNotice, PublicPage } from "@/components/marketing/public-page";

const extensions = [
  { name: ".com", price: "$9.99" },
  { name: ".net", price: "$11.99" },
  { name: ".org", price: "$8.99" },
  { name: ".dev", price: "$12.99" },
];

function normalizeQuery(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

export const metadata = {
  title: "Domain search | Domivexa",
  description: "Search domain names and explore domain extensions.",
};

type SearchParams = Promise<{ q?: string | string[] }>;

function SearchFallback() {
  return (
    <div className="mx-auto max-w-4xl space-y-7" aria-busy="true">
      <div className="h-[4.5rem] animate-pulse rounded-2xl bg-white/80" />
      <p className="text-center text-sm text-[#68766d]">Preparing domain search...</p>
    </div>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <PublicPage
      eyebrow="Domain search"
      title="Find the right address for your idea."
      intro="Search a name, explore popular endings, and see exactly what is—and is not—available in this preview."
    >
      <Suspense fallback={<SearchFallback />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </PublicPage>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q ?? "";
  const query = normalizeQuery(rawQuery);
  const validQuery = query.length <= 253 && /^[a-z0-9.-]*$/.test(query);
  const baseName = query.includes(".") ? query.slice(0, query.indexOf(".")) : query;

  return (
    <div className="mx-auto max-w-4xl space-y-7">
        <form action="/search" method="get" className="flex flex-col gap-2 rounded-2xl border border-[#e3ebe2] bg-white p-2.5 shadow-[0_16px_50px_-24px_rgba(23,65,41,0.28)] sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
            <span className="sr-only">Domain name or keyword</span>
            <span aria-hidden="true" className="material-symbols-rounded text-2xl text-[#7b8b7e]">search</span>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Try yourbrand.com"
              required
              maxLength={253}
              autoComplete="url"
              className="min-w-0 flex-1 rounded-xl py-3.5 text-sm outline-none placeholder:text-gray-400 sm:text-base"
            />
          </label>
          <button type="submit" className="glass-button inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white">
            Search domains <span aria-hidden="true" className="material-symbols-rounded text-base">arrow_forward</span>
          </button>
        </form>

        {!query ? (
          <div className="rounded-2xl border border-dashed border-[#d8e5d9] bg-white/70 px-6 py-12 text-center">
            <span aria-hidden="true" className="material-symbols-rounded text-4xl text-[#77a783]">travel_explore</span>
            <h2 className="mt-4 font-heading text-xl font-bold">Start with a name you love</h2>
            <p className="mt-2 text-sm text-[#68766d]">Type a domain or keyword above to explore supported extensions.</p>
          </div>
        ) : !validQuery ? (
          <div role="alert" className="rounded-2xl border border-[#f1d8d2] bg-[#fff8f6] p-5 text-sm leading-6 text-[#8b3c2d]">
            Enter a domain name using letters, numbers, dots, or hyphens. Please check the spelling and try again.
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-heading text-xl font-bold">Suggestions for &quot;{query}&quot;</h2>
              <p className="mt-1 text-sm text-[#718078]">Availability status is not checked.</p>
            </div>
            <DemoNotice>
              Live registrar availability and prices are not connected. These are sample
              suggestions—not confirmations that a domain is available or purchasable.
            </DemoNotice>
            <div className="overflow-hidden rounded-2xl border border-[#e7ece7] bg-white">
              {extensions.map((extension) => (
                <div key={extension.name} className="flex flex-col gap-3 border-b border-[#edf1ed] p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf6ee] text-[#218259]">
                      <span aria-hidden="true" className="material-symbols-rounded">language</span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-lg font-bold">{baseName || query}{extension.name}</p>
                      <p className="mt-1 text-xs text-[#718078]">Sample price: {extension.price}/year · not verified</p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#f2f4f2] px-3 py-2 text-xs font-semibold text-[#68766d]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9aa49d]" />
                    Not checked
                  </span>
                </div>
              ))}
            </div>
            <Link href="/pricing" className="inline-flex items-center gap-1 text-sm font-semibold text-[#176b4d]">
              How sample pricing works <span aria-hidden="true" className="material-symbols-rounded text-base">arrow_forward</span>
            </Link>
          </>
        )}
    </div>
  );
}
