import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Herinneringen · Bas Arens",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function MemoriesPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5efe5] px-6 text-[#29392e]">
      <div className="max-w-lg text-center">
        <p className="text-xs uppercase tracking-[0.25em]">Bas Arens · herinneringen</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight">Heb je bewijsmateriaal?</h1>
        <p className="mt-6 leading-relaxed">Heb je foto’s voor Bas? Open de persoonlijke uitnodigingslink die je van hem hebt ontvangen om ze in te sturen.</p>
      </div>
    </main>
  );
}
