import Link from "next/link";
import { MaterialIcon } from "@/components/marketing/material-icon";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

const extensions = [
  { name: ".com", price: "$9.99" },
  { name: ".net", price: "$11.99" },
  { name: ".org", price: "$8.99" },
  { name: ".dev", price: "$12.99" },
];

const services = [
  {
    number: "01",
    icon: "language",
    title: "Domain Registration",
    description:
      "Find the perfect domain name and establish your online identity with ease.",
  },
  {
    number: "02",
    icon: "dns",
    title: "DNS Management",
    description:
      "Manage DNS records and nameservers from one simple dashboard.",
  },
  {
    number: "03",
    icon: "swap_horiz",
    title: "Domain Transfers",
    description:
      "Bring your existing domains together and manage them in one place.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fcfdfb] text-[#172b22]">
      <SiteHeader />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_82%_16%,#e0efe2_0%,transparent_32%),linear-gradient(135deg,#f7faf5_0%,#f1f7f0_55%,#f8faf6_100%)]">
        <div aria-hidden="true" className="absolute -right-28 top-24 h-96 w-96 rounded-full border border-[#cfe2d1]/70" />
        <div aria-hidden="true" className="absolute -right-16 top-36 h-72 w-72 rounded-full border border-[#cfe2d1]/70" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#d7e7d8] bg-white/80 px-4 py-2 text-xs font-bold tracking-[0.12em] text-[#176b4d] shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#62a77b] opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#25865e]" />
              </span>
              YOUR IDEA DESERVES A GREAT ADDRESS
            </div>

            <h1 className="max-w-2xl text-[2.7rem] font-bold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[4.35rem]">
              Make your mark
              <br />
              <span className="typewriter-word text-[#218259]">on the internet.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#59685e] sm:text-lg">
              Find a name that feels like you, then bring your online home to
              life. A simpler start for your next big thing.
            </p>

            {/* Domain Search */}
            <form
              action="/search"
              method="get"
              className="mt-9 flex flex-col gap-2 rounded-[1.35rem] border border-[#e3ebe2] bg-white p-2.5 shadow-[0_16px_50px_-24px_rgba(23,65,41,0.28)] transition focus-within:border-[#91b99c] focus-within:ring-4 focus-within:ring-[#176b4d]/10 sm:flex-row sm:items-center"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <MaterialIcon name="search" className="text-2xl text-[#7b8b7e]" />
                <input
                  type="text"
                  name="q"
                  placeholder="Try yourbrand.com"
                  aria-label="Enter your domain name"
                  autoComplete="url"
                  required
                  className="min-w-0 flex-1 rounded-xl py-3.5 text-sm text-[#172b22] outline-none placeholder:text-gray-400 sm:text-base"
                />
              </label>

              <button
                type="submit"
                className="rounded-xl bg-[#176b4d] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10553c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b4d] sm:px-7 sm:text-base"
              >
                Find my domain <MaterialIcon name="arrow_forward" className="ml-1 text-base" />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#66736a]">
              <span className="font-medium">Popular endings</span>
              {extensions.map((item) => (
                <a
                  key={item.name}
                  href="/domains"
                  className="font-bold text-[#344b3b] transition hover:text-[#176b4d]"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div aria-hidden="true" className="absolute -right-5 top-6 h-28 w-28 rounded-[2rem] bg-[#cfe4d2] sm:-right-8" />
            <div aria-hidden="true" className="absolute -bottom-5 -left-5 h-28 w-28 rounded-full border-[12px] border-[#deebdf]" />

            <div className="relative rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_28px_90px_-40px_rgba(20,65,39,0.38)] sm:p-7">
              <div className="flex items-center justify-between border-b border-[#edf1ed] pb-5">
                <div>
                  <p className="font-bold tracking-tight">Your online home</p>
                  <p className="mt-1 text-xs text-gray-500">
                    A little preview of what&apos;s possible
                  </p>
                </div>
                <span className="rounded-full bg-[#edf6ee] px-3 py-2 text-xs font-semibold text-[#218259]">
                  SAMPLE
                </span>
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-[#f5f8f3] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Your first domain</p>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#218259]">
                    <span className="h-2 w-2 rounded-full bg-[#56a875]" />
                    Ready when you are
                  </span>
                </div>
                <h2 className="mt-3 break-all text-2xl font-bold tracking-tight sm:text-3xl">
                  yourbrand<span className="text-[#218259]">.com</span>
                </h2>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#edf1ed] bg-white p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf6ee] text-sm text-[#218259]"><MaterialIcon name="dns" /></span>
                    <p className="mt-3 text-xs text-gray-500">Manage DNS</p>
                    <p className="mt-1 text-sm font-semibold">All in one place</p>
                  </div>
                  <div className="rounded-xl border border-[#edf1ed] bg-white p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf6ee] text-sm text-[#218259]"><MaterialIcon name="open_in_new" /></span>
                    <p className="mt-3 text-xs text-gray-500">Connect a site</p>
                    <p className="mt-1 text-sm font-semibold">On your terms</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-[#edf1ed] p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf4eb] text-xl text-[#218259]">
                  <MaterialIcon name="auto_awesome" />
                </span>
                <div>
                  <p className="text-sm font-semibold">A name that grows with you</p>
                  <p className="mt-1 text-sm leading-5 text-gray-500">
                    From first idea to your next big chapter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-[#e9efe9] bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-[#59685e] sm:justify-between">
          <span className="font-semibold text-[#263a2d]">A simpler way to get online</span>
          <span className="flex items-center gap-2"><MaterialIcon name="check_circle" className="text-[#25865e]" /> Find a name you love</span>
          <span className="flex items-center gap-2"><MaterialIcon name="check_circle" className="text-[#25865e]" /> Manage it with ease</span>
          <span className="flex items-center gap-2"><MaterialIcon name="check_circle" className="text-[#25865e]" /> Connect your website</span>
        </div>
      </div>

      {/* Domain Extensions */}
      <section id="domains" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25865e]">
            FIND YOUR NAME
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                Find a name that feels like yours.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-[#59685e]">
                The right ending can make your idea easier to remember. Start
                with a few of the most-loved options.
              </p>
            </div>

            <Link
              href="#services"
              className="font-semibold text-[#176b4d] transition hover:underline"
            >
              Explore services <MaterialIcon name="arrow_forward" className="align-middle text-base" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {extensions.map((item) => (
              <article
                key={item.name}
                className="group rounded-[1.5rem] border border-[#e7ece7] bg-white p-6 shadow-[0_8px_24px_-20px_rgba(23,65,41,0.3)] transition duration-200 hover:-translate-y-1 hover:border-[#b8d6c0] hover:shadow-[0_18px_38px_-20px_rgba(23,65,41,0.28)]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold">{item.name}</h3>
                  <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5ed] text-lg text-[#218259] transition-colors group-hover:bg-[#176b4d] group-hover:text-white">
                    <MaterialIcon name="arrow_outward" />
                  </span>
                </div>

                <p className="mt-4 text-sm text-[#66736a]">
                  A home for your next big idea.
                </p>

                <div className="mt-7 border-t border-[#edf1ed] pt-5">
                  <p className="text-xs text-gray-500">Illustrative price</p>
                  <p className="mt-1 text-2xl font-bold">
                    {item.price}
                    <span className="text-sm font-normal text-gray-500">
                      /year
                    </span>
                  </p>
                  <Link
                    href={`/search?q=${encodeURIComponent(`yourname${item.name}`)}`}
                    className="glass-button-light mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#176b4d]"
                  >
                    Search {item.name} <MaterialIcon name="arrow_forward" className="text-base" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-5 text-xs leading-5 text-gray-500">
            Prices are design placeholders, not verified live prices. Actual
            registration and renewal prices will depend on the domain provider.
          </p>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-24 bg-[#f3f7f2] px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25865e]">
              OUR SERVICES
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              Everything you need, in one place.
            </h2>
            <p className="mt-4 leading-7 text-[#59685e]">
              Simple tools to help you register, manage, and connect your
              digital identity.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.number}
                className="rounded-[1.5rem] border border-[#e7ece7] bg-white p-7 shadow-[0_8px_24px_-20px_rgba(23,65,41,0.3)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_-20px_rgba(23,65,41,0.28)] sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4eb] text-3xl text-[#218259]">
                    <MaterialIcon name={service.icon} />
                  </span>
                  <span className="text-sm font-semibold text-gray-400">
                    {service.number}
                  </span>
                </div>

                <h3 className="mt-7 text-xl font-bold">{service.title}</h3>
                <p className="mt-3 leading-7 text-[#59685e]">
                  {service.description}
                </p>

                <a
                  href="#how-it-works"
                  className="mt-6 inline-block font-semibold text-[#176b4d] transition hover:underline"
                >
                  Learn more <MaterialIcon name="arrow_forward" className="align-middle text-base" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25865e]">
              HOW IT WORKS
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              From domain search to website launch.
            </h2>
            <p className="mt-5 leading-8 text-[#59685e]">
              Your domain should work for you, not create extra work. Domivexa
              aims to make every step easier.
            </p>

            <div className="mt-9 space-y-7">
              {[
                {
                  number: "01",
                  title: "Find your domain",
                  text: "Search for a domain name that matches your brand.",
                },
                {
                  number: "02",
                  title: "Register your name",
                  text: "Choose an available domain and complete registration.",
                },
                {
                  number: "03",
                  title: "Connect your website",
                  text: "Configure DNS records or nameservers for your platform.",
                },
              ].map((step) => (
                <div key={step.number} className="flex gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf4eb] text-sm font-bold text-[#176b4d]">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#59685e]">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            id="about"
            className="scroll-mt-24 rounded-[2rem] bg-[#176b4d] p-8 text-white sm:p-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#bde5c9]">
              YOUR DIGITAL HOME
            </p>

            <h3 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
              One place for your online identity.
            </h3>

            <p className="mt-5 leading-8 text-[#e0eee4]">
              Whether you are launching a personal website, building a business,
              or growing an online brand, your domain is the first step.
            </p>

            <div className="mt-9 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <p className="text-2xl font-bold">Simple</p>
                <p className="mt-2 text-sm text-[#d3e9da]">
                  Easy domain management
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <p className="text-2xl font-bold">Flexible</p>
                <p className="mt-2 text-sm text-[#d3e9da]">
                  Connect your preferred platform
                </p>
              </div>
            </div>

            <a
              href="#domains"
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3.5 font-bold text-[#176b4d] transition hover:bg-[#eaf4eb]"
            >
              Find Your Domain <MaterialIcon name="arrow_forward" className="align-middle text-base" />
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-20 sm:px-8 lg:pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#e8eee8] bg-[radial-gradient(ellipse_at_50%_0%,#e0efe2_0%,#f4f8f2_55%,#f4f8f2_100%)] px-6 py-14 text-center sm:px-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25865e]">
            START YOUR JOURNEY
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            Ready to claim your place online?
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#59685e]">
            Start with a domain name and build something worth sharing.
          </p>

          <Link
            href="/search"
            className="mt-8 inline-flex rounded-xl bg-[#176b4d] px-7 py-4 font-semibold text-white shadow-sm transition hover:bg-[#10553c]"
          >
            Search Your Domain <MaterialIcon name="arrow_forward" className="align-middle text-base" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}