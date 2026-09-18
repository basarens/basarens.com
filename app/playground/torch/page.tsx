import { SiteBackButton } from "@/components/site-back-button";
import { TorchRoomExperiment } from "@/components/torch-room-experiment";

export default function TorchPlaygroundPage() {
  return (
    <main className="min-h-screen bg-[#050509] px-3 py-3 text-[#fff6c7] sm:p-5">
      <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-[1500px] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0a0f] shadow-[10px_12px_0_#ffb01f] sm:min-h-[calc(100svh-2.5rem)] sm:rounded-[2.25rem]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <SiteBackButton href="/" label="Terug naar basarens.com" />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#fdc32d]">
            Playground · prototype 01
          </p>
        </header>
        <TorchRoomExperiment />
      </div>
    </main>
  );
}
