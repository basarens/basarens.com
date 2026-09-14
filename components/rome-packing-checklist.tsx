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
      { id: "phone", label: "Telefoonoplader" },
      { id: "powerbank", label: "Powerbank in je accessoire, niet in ruimbagage", optional: true },
      { id: "medicine", label: "Medicijnen die je onderweg nodig hebt", optional: true },
    ],
  },
  {
    title: "Vloeistoffen & kleding",
    items: [
      { id: "liquids", label: "Vloeistoffen van maximaal 100 ml in een doorzichtig 1-literzakje" },
      { id: "shoes", label: "Comfortabele loopschoenen" },
      { id: "layers", label: "Kledinglaag en jas voor november in Rome" },
      { id: "glasses", label: "Bril, zonnebril of lenzen als je die nodig hebt", optional: true },
    ],
  },
];

const requiredItemIds = checklist.flatMap((group) =>
  group.items.filter((item) => !item.optional).map((item) => item.id),
);

const optionalItemIds = checklist.flatMap((group) =>
  group.items.filter((item) => item.optional).map((item) => item.id),
);

type ChecklistState = {
  checked: string[];
  includedOptional: string[];
};

const emptyChecklistState: ChecklistState = { checked: [], includedOptional: [] };

export function RomePackingChecklist() {
  const [checklistState, setChecklistState] = useState<ChecklistState>(emptyChecklistState);

  useEffect(() => {
    const loadSavedItems = window.setTimeout(() => {
      const savedItems = window.localStorage.getItem(storageKey);

      if (!savedItems) return;

      try {
        const parsedItems: unknown = JSON.parse(savedItems);
        if (Array.isArray(parsedItems) && parsedItems.every((item) => typeof item === "string")) {
          setChecklistState({
            checked: parsedItems,
            includedOptional: parsedItems.filter((item) => optionalItemIds.includes(item)),
          });
        }

        if (
          typeof parsedItems === "object" &&
          parsedItems !== null &&
          "checked" in parsedItems &&
          "includedOptional" in parsedItems &&
          Array.isArray(parsedItems.checked) &&
          Array.isArray(parsedItems.includedOptional) &&
          parsedItems.checked.every((item) => typeof item === "string") &&
          parsedItems.includedOptional.every((item) => typeof item === "string")
        ) {
          setChecklistState({
            checked: parsedItems.checked,
            includedOptional: parsedItems.includedOptional,
          });
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);

    return () => window.clearTimeout(loadSavedItems);
  }, []);

  function updateChecklist(updater: (currentState: ChecklistState) => ChecklistState) {
    setChecklistState((currentState) => {
      const nextState = updater(currentState);
      window.localStorage.setItem(storageKey, JSON.stringify(nextState));
      return nextState;
    });
  }

  function toggleItem(id: string) {
    updateChecklist((currentState) => ({
      ...currentState,
      checked: currentState.checked.includes(id)
        ? currentState.checked.filter((item) => item !== id)
        : [...currentState.checked, id],
    }));
  }

  function includeOptionalItem(id: string) {
    updateChecklist((currentState) => ({
      ...currentState,
      includedOptional: [...currentState.includedOptional, id],
    }));
  }

  function removeOptionalItem(id: string) {
    updateChecklist((currentState) => ({
      checked: currentState.checked.filter((item) => item !== id),
      includedOptional: currentState.includedOptional.filter((item) => item !== id),
    }));
  }

  const activeItemIds = [...requiredItemIds, ...checklistState.includedOptional];
  const totalItems = activeItemIds.length;
  const completed = checklistState.checked.filter((item) => activeItemIds.includes(item)).length;
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
                const isOptional = item.optional === true;
                const isIncluded = !isOptional || checklistState.includedOptional.includes(item.id);
                const isChecked = checklistState.checked.includes(item.id);

                return (
                  <li key={item.id}>
                    {isIncluded ? (
                      <div className={`flex items-start gap-3 rounded-2xl px-3 py-3 text-sm leading-relaxed transition-colors ${isChecked ? "bg-[#ffd2dd]/70 text-[#b31c38]/55" : "bg-white/60 text-[#b31c38]/85 hover:bg-white"}`}>
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                          <input
                            checked={isChecked}
                            className="mt-1 h-4 w-4 shrink-0 accent-[#ce0f3d]"
                            onChange={() => toggleItem(item.id)}
                            type="checkbox"
                          />
                          <span className={isChecked ? "line-through" : undefined}>{item.label}</span>
                        </label>
                        {isOptional ? (
                          <button className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-[#b31c38]/50 underline underline-offset-4" onClick={() => removeOptionalItem(item.id)} type="button">
                            Niet nodig
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl bg-white/35 px-3 py-3 text-sm leading-relaxed text-[#b31c38]/65">
                        <span className="min-w-0 flex-1">{item.label} <span className="font-mono text-[9px] uppercase tracking-[0.1em]">· optioneel</span></span>
                        <button className="shrink-0 rounded-full border border-[#ce0f3d]/30 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#ce0f3d] transition-colors hover:bg-[#ce0f3d] hover:text-white" onClick={() => includeOptionalItem(item.id)} type="button">
                          Ik neem mee
                        </button>
                      </div>
                    )}
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
