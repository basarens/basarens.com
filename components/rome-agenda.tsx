"use client";

import { useRef, useState } from "react";

const days = [
  {
    number: "06",
    weekday: "vrijdag",
    month: "november",
    color: "bg-[#ce0f3d] text-white",
    accent: "#fa9ab0",
    labelColor: "text-[#ffd2dd]",
    title: "Op weg naar Roma",
    intro: "De reisdag: van Oldenzaal naar Schiphol, daarna door naar Fiumicino en jullie verblijf in Prati.",
    items: [
      ["Nog te kiezen", "Samen naar Schiphol — trein vanuit Oldenzaal of met de auto."],
      ["09:45", "KL1603 vertrekt vanaf Amsterdam Schiphol (AMS). Stoel 17B."],
      ["11:55", "Geplande aankomst op Rome Fiumicino (FCO)."],
      ["Daarna", "Transfer naar Via Properzio 32 in Rome. Route kiezen we later."],
    ],
  },
  {
    number: "07",
    weekday: "zaterdag",
    month: "november",
    color: "bg-[#b31c38] text-white",
    accent: "#ffd2dd",
    labelColor: "text-[#ffd2dd]",
    title: "De eerste volle dag",
    intro: "Hier komt jullie eerste echte Rome-dag te staan: ontbijt, plannen en de eerste plekken om te ontdekken.",
    items: [
      ["Ochtend", "Nog open — samen invullen zodra de eerste activiteiten vaststaan."],
      ["Middag", "Nog open — ruimte voor de eerste route door Rome."],
      ["Avond", "Nog open — een goed moment voor eten, drinken en de eerste foto’s."],
    ],
  },
  {
    number: "08",
    weekday: "zondag",
    month: "november",
    color: "bg-[#ce0f3d] text-white",
    accent: "#fa9ab0",
    labelColor: "text-[#ffd2dd]",
    title: "Nog een dag Rome",
    intro: "De agenda is bewust nog leeg. Zo kunnen jullie plannen zonder dat de app al doet alsof alles vastligt.",
    items: [
      ["Ochtend", "Nog open — bijvoorbeeld een wijk, museum of markt."],
      ["Middag", "Nog open — hier komt later de gezamenlijke activiteit."],
      ["Avond", "Nog open — ruimte voor een laatste Romeinse avond."],
    ],
  },
  {
    number: "09",
    weekday: "maandag",
    month: "november",
    color: "bg-[#b31c38] text-white",
    accent: "#ffd2dd",
    labelColor: "text-[#fa9ab0]",
    title: "Arrivederci, Roma",
    intro: "Uitchecken, terug naar Fiumicino en weer naar Amsterdam. Daarna kiezen jullie de route terug naar Oldenzaal.",
    items: [
      ["Ochtend", "Uitchecken en van Via Properzio 32 naar Fiumicino (FCO)."],
      ["12:45", "KL1604 vertrekt vanaf Fiumicino. Stoel 17F."],
      ["15:20", "Geplande aankomst op Amsterdam Schiphol (AMS)."],
      ["Daarna", "Samen terug naar Oldenzaal — trein of auto nog kiezen."],
    ],
  },
];

export function RomeAgenda() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeDay, setActiveDay] = useState(0);

  function scrollDays(direction: "previous" | "next") {
    const carousel = carouselRef.current;
    const firstDay = carousel?.querySelector<HTMLElement>("button");
    if (!carousel || !firstDay) return;

    carousel.scrollBy({
      left: (firstDay.offsetWidth + 16) * (direction === "next" ? 1 : -1),
      behavior: "smooth",
    });
  }

  const day = days[activeDay];

  return (
    <div>
      <div
        aria-label="Reisdagen"
        className="project-strip -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-5 sm:-mx-10 sm:px-10 lg:-mx-16 lg:px-16"
        ref={carouselRef}
        role="tablist"
      >
        {days.map((item, index) => (
          <button
            aria-controls="agenda-detail"
            aria-selected={index === activeDay}
            className={`group relative aspect-square w-[62vw] shrink-0 snap-center overflow-hidden rounded-full p-6 text-left transition duration-500 hover:-translate-y-2 hover:rotate-[-3deg] sm:w-72 sm:p-8 ${item.color} ${
              index === activeDay ? "scale-100" : "scale-[0.94] opacity-70"
            }`}
            key={item.number}
            onClick={() => setActiveDay(index)}
            role="tab"
            type="button"
          >
            <span
              className="absolute -right-9 -top-9 h-32 w-32 rounded-full border-[16px] transition-transform duration-700 group-hover:scale-125"
              style={{ borderColor: item.accent }}
            />
            <span className="relative block h-full">
              <span className={`absolute left-0 top-0 font-mono text-[10px] uppercase tracking-[0.14em] ${item.labelColor}`}>
                {item.weekday}
              </span>
              <span className="absolute inset-0 grid place-items-center text-7xl font-semibold leading-none tracking-[-0.09em] sm:text-8xl">
                {item.number}
              </span>
              <span className="absolute bottom-0 left-0 font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                {item.month}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b31c38]/60">
          Tik op een dag voor de planning
        </p>
        <div className="flex gap-2">
          <button
            aria-label="Vorige reisdag"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#b31c38]/20 transition-colors hover:bg-[#b31c38] hover:text-white"
            onClick={() => scrollDays("previous")}
            type="button"
          >
            ←
          </button>
          <button
            aria-label="Volgende reisdag"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#b31c38]/20 transition-colors hover:bg-[#b31c38] hover:text-white"
            onClick={() => scrollDays("next")}
            type="button"
          >
            →
          </button>
        </div>
      </div>

      <section
        className="mt-8 border-y border-[#b31c38]/20 py-8 sm:grid sm:grid-cols-[0.8fr_1.2fr] sm:gap-10 sm:py-10"
        id="agenda-detail"
        role="tabpanel"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ce0f3d]">
            {day.weekday} {day.number} {day.month}
          </p>
          <h3 className="mt-3 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
            {day.title}
          </h3>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#b31c38]/70 sm:text-base">
            {day.intro}
          </p>
        </div>
        <ol className="mt-8 border-l border-[#b31c38]/20 sm:mt-0">
          {day.items.map(([time, description]) => (
            <li className="relative grid gap-2 border-b border-[#b31c38]/15 py-5 pl-6 last:border-0 sm:grid-cols-[6rem_1fr]" key={time}>
              <span className="absolute -left-1.5 top-6 h-3 w-3 rounded-full bg-[#ce0f3d]" />
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#b31c38]/60">
                {time}
              </p>
              <p className="text-sm leading-relaxed text-[#b31c38]/80">{description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
