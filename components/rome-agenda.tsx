"use client";

import { useEffect, useRef, useState } from "react";

const days = [
  {
    number: "06",
    weekday: "vrijdag",
    month: "november",
    color: "bg-[#ce0f3d] text-white",
    accent: "#fa9ab0",
    labelColor: "text-[#ffd2dd]",
    title: "Op weg naar Roma",
    intro: "De reisdag: van Oldenzaal naar Schiphol, daarna door naar Fiumicino en ons verblijf in Prati.",
    items: [
      ["Nog te kiezen", "Samen naar Schiphol — trein vanuit Oldenzaal of met de auto."],
      ["09:45", "KL1603 vertrekt vanaf Amsterdam Schiphol (AMS)."],
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
    intro: "Hier komt onze eerste echte Rome-dag te staan: ontbijt, plannen en de eerste plekken om te ontdekken.",
    items: [
      ["10:45 — 11:45", "Rondleiding door de necropolis."],
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
    title: "Rome blijft verrassen",
    intro: "De agenda is bewust nog leeg. Zo kunnen we plannen zonder dat de app al doet alsof alles vastligt.",
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
    intro: "Uitchecken, terug naar Fiumicino en weer naar Amsterdam. Daarna kiezen we de route terug naar Oldenzaal.",
    items: [
      ["Ochtend", "Uitchecken en van Via Properzio 32 naar Fiumicino (FCO)."],
      ["12:45", "KL1604 vertrekt vanaf Fiumicino."],
      ["15:20", "Geplande aankomst op Amsterdam Schiphol (AMS)."],
      ["Daarna", "Samen terug naar Oldenzaal — trein of auto nog kiezen."],
    ],
  },
];

export function RomeAgenda() {
  const dayRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleDays = entries.filter((entry) => entry.isIntersecting);
        if (visibleDays.length === 0) return;

        const mostVisibleDay = visibleDays.reduce((current, next) =>
          next.intersectionRatio > current.intersectionRatio ? next : current,
        );
        const index = Number(mostVisibleDay.target.getAttribute("data-day-index"));

        if (!Number.isNaN(index)) {
          setActiveDay(index);
        }
      },
      { rootMargin: "-28% 0px -45% 0px", threshold: [0.15, 0.4, 0.7] },
    );

    dayRefs.current.forEach((day) => {
      if (day) observer.observe(day);
    });

    return () => observer.disconnect();
  }, []);

  function scrollToDay(index: number) {
    dayRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] gap-3 sm:grid-cols-[minmax(0,1fr)_3rem] sm:gap-6">
      <div>
        <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.14em] text-[#b31c38]/60">
          Scroll door de dagen
        </p>

        <div className="space-y-14 sm:space-y-20">
          {days.map((day, index) => (
            <section
              aria-labelledby={`day-${day.number}-title`}
              className="scroll-mt-8 border-b border-[#b31c38]/20 pb-14 last:border-0 last:pb-0 sm:pb-20"
              data-day-index={index}
              id={`day-${day.number}`}
              key={day.number}
              ref={(element) => {
                dayRefs.current[index] = element;
              }}
            >
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
                <div
                  className={`group relative aspect-square overflow-hidden rounded-full p-4 shadow-[7px_8px_0_#76142a] transition-transform duration-500 sm:p-6 ${day.color} ${
                    activeDay === index ? "scale-100" : "scale-[0.94]"
                  }`}
                >
                  <span
                    className="absolute -right-7 -top-7 h-24 w-24 rounded-full border-[13px] transition-transform duration-700 group-hover:scale-125 sm:h-32 sm:w-32 sm:border-[16px]"
                    style={{ borderColor: day.accent }}
                  />
                  <span className="relative block h-full">
                    <span className={`absolute left-0 top-0 font-mono text-[8px] uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.14em] ${day.labelColor}`}>
                      {day.weekday}
                    </span>
                    <span className="absolute inset-0 grid place-items-center text-5xl font-semibold leading-none tracking-[-0.09em] sm:text-7xl">
                      {day.number}
                    </span>
                    <span className="absolute bottom-0 left-0 font-mono text-[8px] uppercase tracking-[0.12em] opacity-70 sm:text-[10px] sm:tracking-[0.14em]">
                      {day.month}
                    </span>
                  </span>
                </div>

                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#ce0f3d] sm:text-[10px]">
                    {day.weekday} · {day.number} {day.month}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold leading-[0.92] tracking-[-0.07em] sm:mt-3 sm:text-5xl" id={`day-${day.number}-title`}>
                    {day.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-[#b31c38]/70 sm:mt-5 sm:text-base">
                    {day.intro}
                  </p>
                </div>
              </div>

              <ol className="mt-8 border-l border-[#b31c38]/20 sm:mt-10 sm:ml-[13.5rem]">
                {day.items.map(([time, description]) => (
                  <li className="relative grid gap-2 border-b border-[#b31c38]/15 py-5 pl-6 last:border-0 sm:grid-cols-[6rem_1fr]" key={time}>
                    <span className="absolute -left-1.5 top-6 h-3 w-3 rounded-full bg-[#ce0f3d]" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#b31c38]/60">{time}</p>
                    <p className="text-sm leading-relaxed text-[#b31c38]/80">{description}</p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>

      <nav aria-label="Spring naar een reisdag" className="sticky top-5 h-fit self-start pt-8 sm:top-8">
        <ol className="relative flex flex-col items-center gap-4 before:absolute before:inset-y-3 before:w-px before:bg-[#b31c38]/20">
          {days.map((day, index) => {
            const isActive = activeDay === index;

            return (
              <li className="relative" key={day.number}>
                <button
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Ga naar ${day.weekday} ${day.number} ${day.month}`}
                  className={`grid place-items-center rounded-full border transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ce0f3d] ${
                    isActive
                      ? "h-10 w-10 border-[#ce0f3d] bg-[#ce0f3d] font-mono text-[10px] text-white shadow-[3px_4px_0_#76142a]"
                      : "h-5 w-5 border-[#b31c38]/25 bg-[#f4f4f4] hover:scale-125 hover:border-[#ce0f3d]"
                  }`}
                  onClick={() => scrollToDay(index)}
                  type="button"
                >
                  {isActive ? day.number : <span className="h-1.5 w-1.5 rounded-full bg-[#b31c38]/50" />}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
