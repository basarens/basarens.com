import Link from "next/link";
import Image from "next/image";
import { SiteBackButton } from "@/components/site-back-button";

const games = [
  {
    name: "Treasure Hunt",
    eyebrow: "01 · beschikbaar nu",
    description:
      "Een persoonlijke speurtocht vol puzzels, aanwijzingen en kleine verrassingen.",
    href: "/games/treasure-hunt",
    image: "/games/treasure-hunt/assets/icons/ruby.png",
    imageAlt: "Een rode robijn uit Treasure Hunt",
  },
];

export default function GamesPage() {
  return (
    <main className="min-h-screen bg-[#e7f6fc] text-[#023a4f]">
      <div className="mx-auto min-h-screen max-w-[1500px] px-5 py-5 sm:px-10 sm:py-8 lg:px-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <SiteBackButton />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#023a4f]/55 sm:text-xs">
            Game library · {games.length.toString().padStart(2, "0")} game
            {games.length === 1 ? "" : "s"}
          </p>
        </header>

        <section className="py-12 sm:py-16 lg:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#075879]">
            Speelkamer
          </p>
          <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.075em] sm:text-7xl">
            Kies je avontuur.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#023a4f]/70 sm:text-lg">
            Een kleine bibliotheek voor games die ik maak, bewaar en verder
            uitbreid. Kies er eentje en speel meteen.
          </p>

          <div className="mt-10 space-y-5 sm:mt-14">
            {games.map((game) => (
              <Link
                className="group block rounded-[2rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#075879] sm:rounded-[2.5rem]"
                href={game.href}
                key={game.href}
              >
                <article className="relative min-h-[22rem] overflow-hidden rounded-[2rem] bg-[#09090b] p-6 text-white shadow-[8px_10px_0_#075879] transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[11px_14px_0_#075879] sm:min-h-[25rem] sm:rounded-[2.5rem] sm:p-10">
                  <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border-[34px] border-[#fdc32d]/90 transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute -bottom-40 -left-28 h-80 w-80 rounded-full bg-[#681b30] transition-transform duration-500 group-hover:-translate-x-5" />
                  <div className="absolute bottom-0 right-0 h-3/5 w-1/2 bg-[linear-gradient(135deg,transparent_0_48%,rgba(253,195,45,0.16)_48%_50%,transparent_50%_100%)]" />

                  <div className="relative z-10 flex h-full max-w-xl flex-col items-start">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#fdc32d] sm:text-xs">
                      {game.eyebrow}
                    </p>
                    <h2
                      className="mt-8 text-2xl leading-[1.35] text-[#fff6c7] sm:text-4xl"
                      style={{ fontFamily: "var(--font-press-start)" }}
                    >
                      {game.name}
                    </h2>
                    <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">
                      {game.description}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-3 pt-10 font-mono text-[10px] uppercase tracking-[0.14em] text-[#fdc32d] sm:text-xs">
                      Speel {game.name}
                      <span
                        aria-hidden="true"
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#fdc32d] text-base text-black transition-transform duration-300 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </span>
                  </div>

                  <Image
                    alt={game.imageAlt}
                    className="absolute bottom-7 right-6 z-10 w-[39%] max-w-56 drop-shadow-[0_13px_0_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover:-translate-y-3 group-hover:rotate-6 sm:bottom-10 sm:right-12 sm:w-[28%] sm:max-w-72"
                    height={288}
                    src={game.image}
                    width={288}
                  />
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
