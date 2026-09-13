import Link from "next/link";

const buildingBlocks = [
  {
    number: "01",
    title: "Agenda",
    description: "De gezamenlijke planning voor vier dagen Rome.",
    color: "bg-[#ce0f3d] text-white",
    accent: "#fa9ab0",
  },
  {
    number: "02",
    title: "Explore",
    description: "Een kaart met jullie verblijf, plekken en routes.",
    color: "bg-[#54a7d9] text-white",
    accent: "#bbdff3",
  },
  {
    number: "03",
    title: "Italian survival",
    description: "Een paar zinnen voor pizza, birra en il conto.",
    color: "bg-[#fbb01f] text-[#023a4f]",
    accent: "#fedeaf",
  },
  {
    number: "04",
    title: "Roma game",
    description: "Trivia, challenges en een leaderboard voor vijf.",
    color: "bg-[#0d5748] text-white",
    accent: "#bbdfb2",
  },
];

export default function Rome2026Page() {
  return (
    <main className="min-h-screen bg-[#ffd2dd] text-[#b31c38]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between border-b border-[#b31c38]/20 pb-5">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-60"
            href="/"
          >
            <span aria-hidden="true">←</span>
            basarens.com
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b31c38]/60 sm:text-xs">
            Trip companion · in opbouw
          </p>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ce0f3d]">
              6 — 9 november 2026 · vijf reizigers
            </p>
            <h1 className="mt-5 text-6xl font-semibold leading-[0.9] tracking-[-0.08em] sm:text-8xl">
              Roma<br />
              ’26
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-[#b31c38]/75">
              Een kleine reisapp die vóór vertrek helpt plannen en tijdens de
              reis steeds meer jullie gezamenlijke verhaal wordt.
            </p>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-[2.75rem] bg-[#b31c38] p-7 text-white shadow-[12px_14px_0_#ce0f3d] sm:p-9">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[28px] border-[#fa9ab0]" />
            <div className="absolute -bottom-[42%] -left-[45%] h-[120%] w-[120%] rounded-full bg-[#ce0f3d]" />
            <div className="relative flex h-full flex-col">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffd2dd]">
                First big project
              </p>
              <div className="mt-auto">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/65">
                  Startpunt
                </p>
                <p className="mt-2 text-4xl font-semibold leading-none tracking-[-0.07em] sm:text-5xl">
                  De reis
                  <br />
                  begint hier.
                </p>
                <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
                  Nog geen tickets, tijden of route vastgelegd. Eerst bouwen we
                  de plek waar alles straks samenkomt.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#b31c38]/20 py-12 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ce0f3d]">
                Wat er komt
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                Vier onderdelen. Eén reis.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#b31c38]/65">
              We voegen ze één voor één toe zodra we echte reisdetails hebben.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {buildingBlocks.map((block) => (
              <article
                className={`relative min-h-52 overflow-hidden rounded-3xl p-6 sm:p-7 ${block.color}`}
                key={block.number}
              >
                <div
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full border-[16px]"
                  style={{ borderColor: block.accent }}
                />
                <div className="relative flex h-full flex-col">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-60">
                    Onderdeel {block.number}
                  </p>
                  <div className="mt-auto max-w-sm">
                    <h3 className="text-3xl font-semibold tracking-[-0.06em]">
                      {block.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed opacity-75">
                      {block.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#b31c38]/20 py-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#b31c38]/60">
          <p>Roma ’26</p>
          <p>6 — 9 november</p>
        </footer>
      </div>
    </main>
  );
}
