"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

/* ---------- Score distribution histogram (Amplitude "Microscope" drill-down) ---------- */
export function Histogram({ data, threshold }: { data: { bin: string; count: number }[]; threshold: number }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div>
      <div className="flex h-52 items-end gap-2">
        {data.map((d) => {
          const passing = parseInt(d.bin) >= threshold;
          return (
            <button
              key={d.bin}
              onClick={() => setActive(active === d.bin ? null : d.bin)}
              className="group flex flex-1 flex-col items-center gap-2"
            >
              <span className="tnum mono text-[11px] text-text-lo group-hover:text-text-hi">{d.count}</span>
              <div
                className="w-full rounded-t-[3px] transition-all"
                style={{
                  height: `${(d.count / max) * 160}px`,
                  background: active === d.bin ? "var(--iris-b)" : passing ? "rgba(70,208,138,0.5)" : "rgba(255,255,255,0.12)",
                }}
              />
              <span className="mono text-[9px] text-text-lo">{d.bin}</span>
            </button>
          );
        })}
      </div>
      {active && (
        <div className="mt-3 rounded-[6px] border border-hairline bg-void-2 px-3 py-2 text-[12.5px] text-text-mid">
          <span className="mono text-iris-b">Microscope · </span>
          {data.find((d) => d.bin === active)?.count} candidates scored {active}. Click a candidate in ranking to inspect the drivers behind their score.
        </div>
      )}
    </div>
  );
}

/* ---------- Hiring funnel with drop-off ---------- */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = steps[0]?.value || 1;
  let biggestDrop = { from: "", pct: 0 };
  for (let i = 1; i < steps.length; i++) {
    const drop = 1 - steps[i].value / steps[i - 1].value;
    if (drop > biggestDrop.pct) biggestDrop = { from: steps[i].label, pct: drop };
  }
  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        const dropPct = i > 0 ? Math.round((1 - s.value / steps[i - 1].value) * 100) : 0;
        const isBiggest = s.label === biggestDrop.from;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-right text-[12px] text-text-mid">{s.label}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-[4px] bg-white/[0.03]">
              <div
                className="flex h-full items-center rounded-[4px] px-2"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg, rgba(123,147,255,0.35), rgba(199,123,255,0.2))" }}
              >
                <span className="tnum mono text-[11px] text-text-hi">{s.value}</span>
              </div>
            </div>
            <span className="mono w-14 shrink-0 text-[11px]" style={{ color: isBiggest ? "var(--neg)" : "var(--text-lo)" }}>
              {i > 0 ? `-${dropPct}%` : ""}
            </span>
          </div>
        );
      })}
      <div className="mt-3 flex items-center gap-2 rounded-[6px] border border-hairline bg-void-2 px-3 py-2">
        <Info className="h-3.5 w-3.5 text-iris-b" />
        <span className="text-[12px] text-text-mid">
          Largest drop-off at <span className="text-text-hi">{biggestDrop.from}</span> (−{Math.round(biggestDrop.pct * 100)}%). Consider whether the gate there is too strict.
        </span>
      </div>
    </div>
  );
}

export function InterpretNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 text-[12px] text-text-lo">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
