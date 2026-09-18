import { SiteBackButton } from "@/components/site-back-button";

const sheets = [
  "Arabesque No. 1",
  "Experience",
  "It’s Beginning To Look A Lot Like Christmas",
  "Light of the Seven",
  "New York State of Mind",
  "Once Upon a December",
  "Ordinary People",
  "Piano Man",
  "Rêverie",
  "Solas",
  "Victor’s Piano Solo",
].map((title) => ({
  title,
  fileName: title
    .replaceAll("’", "'")
    .concat(".pdf"),
}));

export default function RepertoirePage() {
  return (
    <main className="min-h-screen bg-[#f7f2e8] text-[#25224d]">
      <div className="mx-auto max-w-6xl px-5 py-5 sm:px-10 sm:py-8 lg:px-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <SiteBackButton />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#25224d]/55 sm:text-xs">
            Piano archive · {sheets.length} stukken
          </p>
        </header>

        <section className="grid items-end gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_0.8fr] lg:py-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#665dc3]">
              Mijn muziekmap
            </p>
            <h1 className="mt-3 text-5xl font-semibold leading-[0.9] tracking-[-0.075em] sm:text-7xl">
              Mijn<br />
              repertoire.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#25224d]/70 sm:text-lg">
              Een groeiend archief van stukken die ik wil leren, opnieuw wil
              spelen of gewoon niet wil kwijtraken.
            </p>
          </div>

          <div className="relative min-h-56 overflow-hidden rounded-[2.5rem] bg-[#474295] p-8 text-[#f7f2e8] shadow-[10px_12px_0_#25224d] sm:p-10">
            <div className="absolute -right-14 -top-14 h-56 w-56 rounded-full border-[26px] border-[#bdb5ff]" />
            <div className="absolute -bottom-28 -left-20 h-56 w-56 rounded-full bg-[#665dc3]" />
            <div className="relative flex h-full flex-col justify-between">
              <span aria-hidden="true" className="font-serif text-7xl leading-none">♫</span>
              <p className="max-w-48 font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-[#e5e1ff]">
                Voor stille avonden, grote melodieën en alles daartussenin.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#25224d]/15 py-10 sm:py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#665dc3]">
                Bladmuziek
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                Kies een stuk.
              </h2>
            </div>
            <p className="text-sm text-[#25224d]/60">Pdf · opent in een nieuw tabblad</p>
          </div>

          <div className="divide-y divide-[#25224d]/15 overflow-hidden rounded-[2rem] border border-[#25224d]/15 bg-white/50">
            {sheets.map((sheet, index) => (
              <a
                className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-[#e5e1ff] sm:px-7 sm:py-6"
                href={`/repertoire/${sheet.fileName}`}
                key={sheet.fileName}
                rel="noreferrer"
                target="_blank"
              >
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#665dc3] sm:text-xs">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 text-lg font-semibold tracking-[-0.04em] sm:text-2xl">
                  {sheet.title}
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#25224d]/20 text-lg transition-[transform,background-color,color] group-hover:translate-x-1 group-hover:bg-[#25224d] group-hover:text-white">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
