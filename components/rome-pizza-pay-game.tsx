"use client";

import { useEffect, useState } from "react";

const players = [
  { name: "Anja", chance: 45, color: "#b31c38" },
  { name: "Marcel", chance: 45, color: "#ce0f3d" },
  { name: "Carmen", chance: 10 / 3, color: "#fbb01f" },
  { name: "Bas", chance: 10 / 3, color: "#006853" },
  { name: "Gabrielle", chance: 10 / 3, color: "#ff6c37" },
];

const wheelBackground = "conic-gradient(from 0deg, #b31c38 0% 45%, #ce0f3d 45% 90%, #fbb01f 90% 93.333%, #006853 93.333% 96.666%, #ff6c37 96.666% 100%)";

function choosePlayer() {
  const ticket = Math.random() * 100;
  let boundary = 0;

  for (const player of players) {
    boundary += player.chance;
    if (ticket < boundary) return { player, end: boundary, start: boundary - player.chance };
  }

  return { player: players.at(-1)!, start: 96.666, end: 100 };
}

export function RomePizzaPayGame() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<(typeof players)[number] | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function spinPizza() {
    if (isSpinning) return;

    const selected = choosePlayer();
    const targetAngle = (selected.start + selected.end) * 1.8;
    const currentAngle = ((rotation % 360) + 360) % 360;
    const alignment = (360 - targetAngle - currentAngle + 360) % 360;
    const nextRotation = rotation + 360 * 6 + alignment;

    setWinner(null);
    setIsSpinning(true);
    setRotation(nextRotation);

    window.setTimeout(() => {
      setWinner(selected.player);
      setIsSpinning(false);
    }, 4200);
  }

  function openGame() {
    setIsOpen(true);
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        className="fixed bottom-5 right-5 z-[1100] inline-flex items-center gap-2 rounded-full bg-[#ce0f3d] px-5 py-3 text-sm font-semibold text-white shadow-[5px_6px_0_#76142a] transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-2deg] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ce0f3d] sm:bottom-8 sm:right-8"
        onClick={openGame}
        type="button"
      >
        <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-[#fbb01f] text-base shadow-[inset_0_0_0_3px_#ffd2dd]">🍕</span>
        Wie betaalt?
      </button>

      {isOpen ? (
        <div aria-labelledby="pizza-game-title" aria-modal="true" className="fixed inset-0 z-[1200] grid items-end bg-[#023a4f]/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" role="dialog">
          <button aria-label="Sluit Pizza Roulette" className="absolute inset-0" onClick={() => setIsOpen(false)} type="button" />
          <div className="relative max-h-[92dvh] w-full max-w-3xl overflow-x-hidden overflow-y-auto rounded-t-[2.5rem] bg-[#fff4dc] p-6 text-[#76142a] shadow-[16px_18px_0_#76142a] animate-[pizza-pop_500ms_cubic-bezier(0.16,1,0.3,1)] sm:rounded-[2.5rem] sm:p-9">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border-[26px] border-[#ce0f3d]/20" />
            <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#fbb01f]/30" />

            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#ce0f3d]">Pizza roulette · Roma ’26</p>
                  <h2 className="mt-2 text-4xl font-semibold leading-[0.9] tracking-[-0.075em] sm:text-5xl" id="pizza-game-title">
                    Chi paga la pizza?
                  </h2>
                </div>
                <button aria-label="Sluit Pizza Roulette" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#76142a]/20 text-xl transition-colors hover:bg-[#76142a] hover:text-white" onClick={() => setIsOpen(false)} type="button">×</button>
              </div>

              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#76142a]/70">
                De pizza bepaalt wie de rekening oppakt. De kansen zijn niet gelijk — en dat is volledig met opzet.
              </p>

              <div className="relative mx-auto mt-8 aspect-square w-full max-w-[23rem]">
                <span aria-hidden="true" className="absolute left-1/2 top-0 z-20 -translate-x-1/2 text-5xl leading-none text-[#76142a] drop-shadow-[0_3px_0_#ffd2dd]">▼</span>
                <div aria-hidden="true" className="absolute inset-4 rounded-full bg-[#e9a343] shadow-[inset_0_0_0_10px_#c7742b,0_12px_0_#9e4a25]" />
                <div
                  aria-label="Pizzawiel met vaste kansen"
                  className="absolute inset-7 overflow-hidden rounded-full border-[6px] border-[#ffd2dd] shadow-[inset_0_0_0_3px_#76142a]/30"
                  style={{
                    background: wheelBackground,
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? "transform 4.2s cubic-bezier(0.12, 0.75, 0.09, 1)" : "none",
                  }}
                >
                  <span className="absolute left-[24%] top-[22%] h-8 w-8 rounded-full border-2 border-[#76142a]/30 bg-[#ffd2dd]" />
                  <span className="absolute right-[20%] top-[35%] h-7 w-7 rounded-full border-2 border-[#76142a]/30 bg-[#ffd2dd]" />
                  <span className="absolute bottom-[20%] left-[42%] h-9 w-9 rounded-full border-2 border-[#76142a]/30 bg-[#ffd2dd]" />
                  <span className="absolute bottom-[30%] right-[19%] h-6 w-6 rounded-full border-2 border-[#76142a]/30 bg-[#ffd2dd]" />
                  <span className="absolute left-[15%] top-[54%] h-6 w-6 rounded-full border-2 border-[#76142a]/30 bg-[#ffd2dd]" />
                </div>
                <button
                  aria-label="Draai de pizza"
                  className="absolute inset-[37%] grid place-items-center rounded-full border-4 border-[#ffd2dd] bg-[#fbb01f] text-center font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#76142a] shadow-[0_3px_0_#9e4a25] transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ce0f3d] disabled:cursor-wait disabled:opacity-70"
                  disabled={isSpinning}
                  onClick={spinPizza}
                  type="button"
                >
                  <span>
                    {isSpinning ? "Draait…" : winner ? <>Opnieuw<br />draaien</> : <>Draai de<br />pizza</>}
                  </span>
                </button>
              </div>

              <div aria-live="polite" className={`mt-7 rounded-3xl p-5 text-center transition-colors ${winner ? "bg-[#76142a] text-white" : "bg-[#ffd2dd]/70"}`}>
                {winner ? (
                  <>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffd2dd]">De pizza heeft gesproken</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.06em]">{winner.name} betaalt vanavond. 🍕</p>
                  </>
                ) : (
                  <p className="text-lg font-medium">{isSpinning ? "De oven draait op volle toeren…" : "Draai de pizza en ontdek het lot."}</p>
                )}
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-5">
                {players.map((player) => (
                  <div className="flex items-center gap-2 rounded-2xl bg-white/60 px-3 py-2 text-sm" key={player.name}>
                    <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: player.color }} />
                    <span className="font-medium">{player.name}</span>
                    <span className="ml-auto text-xs text-[#76142a]/55">{player.chance.toFixed(player.chance % 1 === 0 ? 0 : 2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
