"use client";

import { useEffect, useState } from "react";

const storageKey = "roma-2026-packing-checklist";

const checklist = [
  {
    title: "Reisdocumenten",
    items: [
      { id: "id", label: "Paspoort of ID-kaart" },
      { id: "payment", label: "Bankpas, creditcard of wat contant geld" },
      { id: "booking", label: "Boeking en vluchtinformatie opgeslagen op je telefoon" },
    ],
  },
  {
    title: "In de tas",
    items: [
      { id: "bag", label: "Tas past binnen 40 × 30 × 15 cm" },
      { id: "phone", label: "Telefoon en oplader" },
      { id: "powerbank", label: "Powerbank in je accessoire, niet in ruimbagage" },
      { id: "medicine", label: "Medicijnen die je onderweg nodig hebt" },
    ],
  },
  {
    title: "Vloeistoffen & kleding",
    items: [
      { id: "liquids", label: "Vloeistoffen van maximaal 100 ml in een doorzichtig 1-literzakje" },
      { id: "shoes", label: "Comfortabele loopschoenen" },
      { id: "layers", label: "Kledinglaag en jas voor november in Rome" },
      { id: "glasses", label: "Bril, zonnebril of lenzen als je die nodig hebt" },
    ],
  },
];

const totalItems = checklist.reduce((total, group) => total + group.items.length, 0);

export function RomePackingChecklist() {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    const loadSavedItems = window.setTimeout(() => {
      const savedItems = window.localStorage.getItem(storageKey);

      if (!savedItems) return;

      try {
        const parsedItems: unknown = JSON.parse(savedItems);
        if (Array.isArray(parsedItems) && parsedItems.every((item) => typeof item === "string")) {
          setCheckedItems(parsedItems);
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);

    return () => window.clearTimeout(loadSavedItems);
  }, []);

  function toggleItem(id: string) {
    setCheckedItems((currentItems) => {
      const nextItems = currentItems.includes(id)
        ? currentItems.filter((item) => item !== id)
        : [...currentItems, id];

      window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
      return nextItems;
    });
  }

  const completed = checkedItems.length;
  const progress = Math.round((completed / totalItems) * 100);

  return (
    <div className="rounded-[2rem] bg-white/55 p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-lg font-medium">{completed} van {totalItems} dingen geregeld</p>
          <p className="mt-1 text-sm text-[#b31c38]/70">Je voortgang blijft bewaard op dit apparaat.</p>
        </div>
        <p className="font-mono text-xs tracking-[0.12em] text-[#ce0f3d]">{progress}% KLAAR</p>
      </div>

      <div aria-label={`${progress}% van de inpakchecklist afgerond`} aria-valuemax={totalItems} aria-valuemin={0} aria-valuenow={completed} className="mt-5 h-2 overflow-hidden rounded-full bg-[#ffd2dd]" role="progressbar">
        <div className="h-full rounded-full bg-[#ce0f3d] transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-3">
        {checklist.map((group) => (
          <section key={group.title}>
            <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b31c38]/60">{group.title}</h4>
            <ul className="mt-3 space-y-2">
              {group.items.map((item) => {
                const isChecked = checkedItems.includes(item.id);

                return (
                  <li key={item.id}>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 text-sm leading-relaxed transition-colors ${isChecked ? "bg-[#ffd2dd]/70 text-[#b31c38]/55" : "bg-white/60 text-[#b31c38]/85 hover:bg-white"}`}>
                      <input
                        checked={isChecked}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#ce0f3d]"
                        onChange={() => toggleItem(item.id)}
                        type="checkbox"
                      />
                      <span className={isChecked ? "line-through" : undefined}>{item.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
