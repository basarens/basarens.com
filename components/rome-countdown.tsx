"use client";

import { useEffect, useState } from "react";

const departure = new Date("2026-11-06T09:45:00+01:00");

function getTimeRemaining() {
  const difference = Math.max(0, departure.getTime() - Date.now());

  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference % 86_400_000) / 3_600_000),
    minutes: Math.floor((difference % 3_600_000) / 60_000),
    seconds: Math.floor((difference % 60_000) / 1_000),
  };
}

export function RomeCountdown() {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1_000);

    return () => window.clearInterval(interval);
  }, []);

  const units = [
    [timeRemaining.days, "dagen"],
    [timeRemaining.hours, "uur"],
    [timeRemaining.minutes, "min"],
    [timeRemaining.seconds, "sec"],
  ];

  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Aftellen tot vertrek">
      {units.map(([value, label]) => (
        <div className="rounded-2xl bg-white/10 px-2 py-3 text-center" key={label}>
          <p className="text-xl font-semibold tracking-[-0.06em] sm:text-2xl">
            {String(value).padStart(2, "0")}
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-white/60">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
