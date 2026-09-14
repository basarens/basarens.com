import Link from "next/link";
import { RomeAgenda } from "@/components/rome-agenda";
import { RomeCountdown } from "@/components/rome-countdown";
import { RomeMapSection } from "@/components/rome-map-section";
import { RomePackingChecklist } from "@/components/rome-packing-checklist";
import { RomePhotoAlbum } from "@/components/rome-photo-album";

const packingAllowed = [
  "1 accessoire onder de stoel: maximaal 40 × 30 × 15 cm.",
  "Vloeistoffen, gels, crèmes en sprays: verpakking van maximaal 100 ml, samen in één doorzichtig 1-literzakje.",
  "Telefoon, laptop en camera. Een powerbank mag mee als de capaciteit erop staat; bewaar hem bij je.",
  "Medicijnen die je tijdens de vlucht nodig hebt, bij voorkeur met recept of doktersverklaring.",
  "Een lege drinkfles; na security kun je hem weer vullen.",
];

const packingNotAllowed = [
  "Een cabine-trolley van 55 × 35 × 25 cm: die is niet inbegrepen volgens deze boeking.",
  "Vloeistoffen in verpakkingen groter dan 100 ml, ook als ze niet vol zijn.",
  "Scherpe voorwerpen, grote gereedschappen, wapens en zelfverdedigingssprays.",
  "Brandbare of explosieve spullen, zoals vuurwerk, brandstof en gasflessen.",
  "Powerbanks in ruimbagage; reservebatterijen horen bij je in de cabine.",
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

        <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ce0f3d]">
              6 — 9 november 2026 · vijf reizigers
            </p>
            <h1 className="mt-5 text-6xl font-semibold leading-[0.9] tracking-[-0.08em] sm:text-8xl">
              Roma<br />
              ’26
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-[#b31c38]/75">
              De reis begint met een tas die klopt, een route naar Schiphol en
              een gezamenlijke planning die rustig mag groeien.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2.75rem] bg-[#b31c38] p-7 text-white shadow-[12px_14px_0_#76142a] sm:p-9">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[28px] border-[#fa9ab0]" />
            <div className="absolute -bottom-[72%] -left-[75%] h-[160%] w-[160%] rounded-full bg-[#ce0f3d]" />
            <div className="relative">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffd2dd]">
                Aftellen tot KL1603
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Vertrek vanaf Amsterdam Schiphol · vrijdag 6 november · 09:45
              </p>
              <div className="mt-7">
                <RomeCountdown />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#b31c38]/20 py-12 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ce0f3d]">
                Eerst: inpakken
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                Klein inpakken, groots reizen.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#b31c38]/65">
              Belangrijk: de boeking toont geen ruimbagage en geen cabine-trolley.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="rounded-3xl bg-[#b31c38] p-7 text-white sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ffd2dd]">
                Onze huidige boeking
              </p>
              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-4xl font-semibold tracking-[-0.07em]">0×</p>
                  <p className="mt-1 text-sm text-white/70">ruimbagage</p>
                </div>
                <div>
                  <p className="text-4xl font-semibold tracking-[-0.07em]">0×</p>
                  <p className="mt-1 text-sm text-white/70">
                    handbagage / cabine-trolley
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-semibold tracking-[-0.07em]">1×</p>
                  <p className="mt-1 text-sm text-white/70">
                    accessoire · max. 40 × 30 × 15 cm
                  </p>
                </div>
              </div>
              <p className="mt-8 border-t border-white/15 pt-5 text-sm leading-relaxed text-white/70">
                De algemene cabine-trolleymaat is 55 × 35 × 25 cm, maar die is
                bij deze boeking niet inbegrepen. Als we een cabine-trolley
                willen bijkopen, regelen we dat later via My Trip.
              </p>
            </aside>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/55 p-6 sm:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b31c38]/60">
                  Wel meenemen
                </p>
                <ul className="mt-5 space-y-4 text-sm leading-relaxed text-[#b31c38]/80">
                  {packingAllowed.map((item) => (
                    <li className="flex gap-3" key={item}>
                      <span className="mt-1 text-[#ce0f3d]" aria-hidden="true">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-[#ce0f3d] p-6 text-white sm:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ffd2dd]">
                  Niet meenemen
                </p>
                <ul className="mt-5 space-y-4 text-sm leading-relaxed text-white/80">
                  {packingNotAllowed.map((item) => (
                    <li className="flex gap-3" key={item}>
                      <span className="mt-1 text-[#fa9ab0]" aria-hidden="true">×</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#b31c38]/65">
            <a className="underline underline-offset-4 hover:text-[#ce0f3d]" href="https://www.klm.nl/information/baggage/hand-baggage-allowance">
              KLM: bagagevrijstelling
            </a>
            <a className="underline underline-offset-4 hover:text-[#ce0f3d]" href="https://www.klm.nl/information/baggage/restricted-items-hand-baggage">
              KLM: toegestane en verboden voorwerpen
            </a>
            <a className="underline underline-offset-4 hover:text-[#ce0f3d]" href="https://www.schiphol.nl/nl/pagina/vloeistoffen-in-je-handbagage/">
              Schiphol: vloeistoffen bij security
            </a>
          </div>

          <div className="mt-10 border-t border-[#b31c38]/20 pt-10 sm:mt-12 sm:pt-12">
            <div className="mb-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ce0f3d]">
                Onze checklist
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.055em] sm:text-3xl">
                Rustig afvinken, goed vertrekken.
              </h3>
            </div>
            <RomePackingChecklist />
          </div>
        </section>

        <section className="border-t border-[#b31c38]/20 py-12 sm:py-16">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ce0f3d]">
              Agenda
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
              Vier dagen. Ons verhaal.
            </h2>
          </div>
          <RomeAgenda />
        </section>

        <section className="border-t border-[#b31c38]/20 py-12 sm:py-16">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ce0f3d]">
              Explore Rome
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
              Alles begint bij de kaart.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#b31c38]/70">
              Onze uitvalsbasis in Prati, de necropolis en een paar plekken waar we zeker langs willen. Tik op een punt voor de locatie of open hem direct in Google Maps.
            </p>
          </div>
          <RomeMapSection />
        </section>

        <section className="border-t border-[#b31c38]/20 py-12 sm:py-16">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ce0f3d]">
              Fotoalbum
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
              Ons Rome in beelden.
            </h2>
          </div>
          <RomePhotoAlbum />
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#b31c38]/20 py-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#b31c38]/60">
          <p>Roma ’26</p>
          <p>6 — 9 november</p>
        </footer>
      </div>
    </main>
  );
}
