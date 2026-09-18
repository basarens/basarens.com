import { SiteBackButton } from "@/components/site-back-button";

export default function TreasureHuntPage() {
  return (
    <main className="min-h-screen bg-[#07070a] p-3 text-white sm:p-5">
      <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-[1500px] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-[10px_12px_0_#ffb01f] sm:min-h-[calc(100svh-2.5rem)] sm:rounded-[2.25rem]">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
          <SiteBackButton href="/games" label="Terug naar de gamebibliotheek" />
          <a
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#fdc32d] transition-colors hover:text-white"
            href="/games/treasure-hunt/play/index.html"
            rel="noreferrer"
            target="_blank"
          >
            open volledig scherm ↗
          </a>
        </header>

        <div className="min-h-0 flex-1 bg-black">
          <iframe
            allow="autoplay; fullscreen"
            className="h-[calc(100svh-4.75rem)] w-full border-0 sm:h-[calc(100svh-5.25rem)]"
            src="/games/treasure-hunt/play/index.html"
            title="Treasure Hunt"
          />
        </div>
      </div>
    </main>
  );
}
