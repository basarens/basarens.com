import { ProjectsCarousel } from "@/components/projects-carousel";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f5ee] text-[#17231e]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between border-b border-[#17231e]/15 pb-5">
          <a className="text-lg font-semibold tracking-[-0.05em]" href="#projects">
            bas arens<span className="text-[#e95f32]">.</span>
          </a>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#17231e]/55 sm:text-xs">
            personal playground · 2026
          </p>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10 sm:py-14" id="projects">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#e95f32]">
                Projecten in beweging
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.055em] sm:text-3xl">
                Kies een hoekje om te ontdekken.
              </h1>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#17231e]/55">
              Sleep, swipe of gebruik de pijlen om door mijn projecten te gaan.
            </p>
          </div>

          <ProjectsCarousel />
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#17231e]/15 py-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#17231e]/50">
          <p>basarens.com</p>
          <p>Werk in uitvoering</p>
        </footer>
      </div>
    </main>
  );
}
