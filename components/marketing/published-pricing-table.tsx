"use client";

import { useEffect, useState } from "react";

type TldPrice = {
  tld: string;
  registrationPrice: number;
  renewalPrice: number;
  transferPrice: number;
  currency: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

function isTldPrice(value: unknown): value is TldPrice {
  return (
    typeof value === "object" &&
    value !== null &&
    "tld" in value &&
    typeof value.tld === "string" &&
    "registrationPrice" in value &&
    typeof value.registrationPrice === "number" &&
    "renewalPrice" in value &&
    typeof value.renewalPrice === "number" &&
    "transferPrice" in value &&
    typeof value.transferPrice === "number" &&
    "currency" in value &&
    typeof value.currency === "string"
  );
}

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function PublishedPricingTable() {
  const [prices, setPrices] = useState<TldPrice[]>([]);
  const [loading, setLoading] = useState(Boolean(apiUrl));
  const [error, setError] = useState(
    apiUrl ? "" : "Pricing API is not configured. Please try again later.",
  );

  useEffect(() => {
    if (!apiUrl) {
      return undefined;
    }

    const controller = new AbortController();
    void fetch(`${apiUrl}/api/pricing`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          const message =
            result &&
            typeof result === "object" &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "Published pricing is currently unavailable.";
          throw new Error(message);
        }
        if (
          !result ||
          typeof result !== "object" ||
          !("pricing" in result) ||
          !Array.isArray(result.pricing) ||
          !result.pricing.every(isTldPrice)
        ) {
          throw new Error("The pricing service returned an invalid response.");
        }
        setPrices(result.pricing);
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Could not load published TLD pricing:", fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Published pricing is currently unavailable.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div role="status" className="rounded-2xl border border-[#e7ece7] bg-white p-8 text-center text-sm text-[#68766d]">
        Loading current TLD pricing...
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-[#f0dfbd] bg-[#fffaf0] p-5 text-sm leading-6 text-[#745b2e]">
        {error}
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e7ece7] bg-white p-8 text-center">
        <p className="font-semibold text-[#344b3b]">No TLD pricing is currently published.</p>
        <p className="mt-2 text-sm leading-6 text-[#68766d]">Please check back later or contact support for pricing information.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#e7ece7] bg-white">
      <table className="w-full min-w-[680px] text-left">
        <thead className="bg-[#f7faf7] text-xs font-semibold text-[#68766d]">
          <tr>
            <th scope="col" className="px-5 py-4 sm:px-7">Extension</th>
            <th scope="col" className="px-5 py-4 sm:px-7">Registration</th>
            <th scope="col" className="px-5 py-4 sm:px-7">Renewal</th>
            <th scope="col" className="px-5 py-4 sm:px-7">Transfer</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => (
            <tr key={price.tld} className="border-t border-[#edf1ed] text-sm">
              <th scope="row" className="px-5 py-4 font-heading text-lg font-bold text-[#344b3b] sm:px-7">{price.tld}</th>
              <td className="px-5 py-4 text-[#526258] sm:px-7">{formatPrice(price.registrationPrice, price.currency)}</td>
              <td className="px-5 py-4 text-[#526258] sm:px-7">{formatPrice(price.renewalPrice, price.currency)}</td>
              <td className="px-5 py-4 text-[#526258] sm:px-7">{formatPrice(price.transferPrice, price.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
