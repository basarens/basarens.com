"use client";

import dynamic from "next/dynamic";

const RomeMap = dynamic(
  () => import("@/components/rome-map").then((module) => module.RomeMap),
  {
    loading: () => (
      <div className="grid h-[28rem] place-items-center rounded-[2rem] bg-[#b31c38] font-mono text-xs uppercase tracking-[0.14em] text-[#ffd2dd]">
        Kaart laden…
      </div>
    ),
    ssr: false,
  },
);

export function RomeMapSection() {
  return <RomeMap />;
}
