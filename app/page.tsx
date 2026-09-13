const projects = [
  {
    number: "01",
    title: "Rome ’26",
    label: "Reisapp · binnenkort",
    description:
      "Een interactieve reisgenoot voor vijf mensen in Rome: planning, plekken, foto’s en kleine uitdagingen.",
    accent: "bg-[#c8f169]",
  },
  {
    number: "02",
    title: "Data & dingen",
    label: "Visualisaties · in opbouw",
    description:
      "Een thuis voor dashboards, Python-experimenten en manieren om data iets meer tot leven te brengen.",
    accent: "bg-[#ffc7a6]",
  },
  {
    number: "03",
    title: "Playground",
    label: "Experimenten · altijd open",
    description:
      "Kleine ideeën, webgames en projecten die geen andere reden nodig hebben dan dat ze leuk zijn om te maken.",
    accent: "bg-[#a8d8ff]",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f5ee] text-[#17231e]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between border-b border-[#17231e]/15 pb-5">
          <a className="text-lg font-semibold tracking-[-0.05em]" href="#top">
            bas arens<span className="text-[#e95f32]">.</span>
          </a>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#17231e]/55 sm:text-xs">
            personal website · in progress
          </p>
        </header>

        <section
          id="top"
          className="grid flex-1 items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16"
        >
          <div>
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-[#e95f32]">
              Welkom in mijn hoekje van het internet
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.94] tracking-[-0.075em] sm:text-7xl lg:text-8xl">
              Ik maak dingen om te ontdekken.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#17231e]/72 sm:text-xl">
              Dit is mijn persoonlijke playground voor interactieve ideeën,
              data-experimenten, games en projecten die onderweg mogen
              veranderen.
            </p>
            <a
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#17231e] px-5 py-3 text-sm font-medium text-[#f7f5ee] transition-transform hover:-translate-y-1"
              href="#projects"
            >
              Kijk wat er komt
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md rotate-2 rounded-[2.75rem] bg-[#17231e] p-5 shadow-[12px_14px_0_#e95f32] sm:p-7">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-[#215343] p-6 text-[#f7f5ee] sm:p-8">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-white/60">
                <span>currently brewing</span>
                <span>2026</span>
              </div>
              <div className="relative z-10 mt-auto">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#c8f169]">
                  First bigger project
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
                  Roma<br />
                  2026 🇮🇹
                </p>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
                  Een reisapp voor planning, verkennen, foto’s en een beetje
                  competitie.
                </p>
              </div>
              <div className="absolute -right-11 -top-11 h-48 w-48 rounded-full border-[20px] border-[#c8f169]" />
              <div className="absolute right-9 top-24 h-5 w-5 rounded-full bg-[#ffc7a6]" />
              <div className="absolute bottom-8 right-10 font-mono text-5xl text-white/15">
                06—09
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="border-t border-[#17231e]/15 py-12 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#e95f32]">
                In opbouw
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                Ruimte voor ideeën.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#17231e]/60">
              Deze site hoeft nooit af te zijn. Dat is juist het plan.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {projects.map((project) => (
              <article
                className="rounded-3xl border border-[#17231e]/12 bg-white/45 p-6 transition-transform hover:-translate-y-1"
                key={project.number}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs text-[#17231e]/45">
                    {project.number}
                  </span>
                  <span className={`h-3 w-3 rounded-full ${project.accent}`} />
                </div>
                <h3 className="mt-12 text-2xl font-semibold tracking-[-0.05em]">
                  {project.title}
                </h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#e95f32]">
                  {project.label}
                </p>
                <p className="mt-5 text-sm leading-relaxed text-[#17231e]/65">
                  {project.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#17231e]/15 py-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#17231e]/50">
          <p>basarens.com</p>
          <p>Werk in uitvoering</p>
        </footer>
      </div>
    </main>
  );
}
