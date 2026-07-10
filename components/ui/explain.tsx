"use client";

import React, { useState } from "react";
import type { Driver, EvidenceChip as EvidenceChipT, ReasoningStep, CompetencyScore } from "@/lib/types";
import { ConfidenceBadge } from "./primitives";
import { Quote, ChevronRight, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";

/* ---------- Ranked drivers (FICO reason-code structure, principal first) ---------- */
export function DriverList({ drivers }: { drivers: Driver[] }) {
  return (
    <ol className="space-y-2">
      {drivers.map((d, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mono mt-0.5 w-4 shrink-0 text-[11px] text-text-lo">{i + 1}</span>
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-[3px]"
            style={{ background: d.direction === "pos" ? "rgba(70,208,138,0.18)" : "rgba(229,72,77,0.18)", border: `1px solid ${d.direction === "pos" ? "var(--pos)" : "var(--neg)"}` }}
          />
          <div className="flex-1">
            <p className="text-[13.5px] leading-snug text-text-hi">
              {i === 0 && <span className="mono-label mr-2 align-middle">principal</span>}
              {d.text}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{ width: `${d.impact * 100}%`, background: d.direction === "pos" ? "var(--pos)" : "var(--neg)" }} />
              </div>
              <span className="mono text-[10px] text-text-lo inline-flex items-center gap-0.5">
                {d.direction === "pos" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                impact {(d.impact * 100).toFixed(0)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Evidence chips + anchored popover (transcript fragment, 1/N) ---------- */
export function EvidenceChips({ evidence }: { evidence: EvidenceChipT[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (!evidence.length) return null;
  const e = evidence[idx];
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="mono inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-2.5 py-1 text-[11px] text-text-mid transition-colors hover:border-hairline-strong hover:text-text-hi"
      >
        <Quote className="h-3 w-3 text-iris-b" />
        {evidence.length} evidence {evidence.length === 1 ? "fragment" : "fragments"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-2 w-[340px] rounded-md border border-hairline-strong bg-surface-2 p-4 shadow-2xl animate-fade-in-up">
            <div className="mb-2 flex items-center justify-between">
              <span className="mono-label">Interview fragment</span>
              <span className="mono text-[11px] text-text-lo">
                {idx + 1}/{evidence.length}
              </span>
            </div>
            <div className="mb-3 flex items-start gap-2">
              <span
                className="mono mt-0.5 shrink-0 rounded-[3px] px-1.5 py-0.5 text-[10px]"
                style={{ background: e.speaker === "AI" ? "rgba(123,147,255,0.12)" : "rgba(255,255,255,0.06)", color: e.speaker === "AI" ? "var(--iris-b)" : "var(--text-mid)" }}
              >
                {e.speaker}
              </span>
              <span className="mono text-[11px] text-iris-b">{e.timestamp}</span>
            </div>
            <p className="text-[13px] leading-relaxed text-text-hi">&ldquo;{e.fragment}&rdquo;</p>
            {evidence.length > 1 && (
              <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
                <button className="mono text-[11px] text-text-lo hover:text-text-hi" onClick={() => setIdx((i) => (i - 1 + evidence.length) % evidence.length)}>
                  ← prev
                </button>
                <button className="mono text-[11px] text-text-lo hover:text-text-hi" onClick={() => setIdx((i) => (i + 1) % evidence.length)}>
                  next →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Collapsible reasoning trace ("Completed N steps") ---------- */
export function ReasoningTrace({ steps }: { steps: ReasoningStep[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[6px] border border-hairline bg-void-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Layers className="h-3.5 w-3.5 text-iris-c" />
        <span className="text-[12.5px] text-text-mid">
          Completed {steps.length} reasoning steps
        </span>
        <ChevronRight className={`ml-auto h-3.5 w-3.5 text-text-lo transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <ol className="border-t border-hairline px-3 py-2">
          {steps.map((s, i) => (
            <li key={i} className="relative flex gap-3 py-1.5 pl-4">
              <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-iris-c/60" />
              {i < steps.length - 1 && <span className="absolute left-[3px] top-4 h-full w-px bg-hairline" />}
              <div className="flex-1">
                <div className="text-[12.5px] text-text-hi">{s.label}</div>
                <div className="text-[12px] leading-snug text-text-lo">{s.detail}</div>
              </div>
              <div className="mono shrink-0 text-right text-[10px] text-text-lo">
                <div>{s.latencyMs}ms</div>
                <div>{s.tokens} tok</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ---------- Confidence expand ("what drives this confidence") ---------- */
export function ConfidenceExpand({ comp }: { comp: CompetencyScore }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="inline-flex flex-col items-start">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5">
        <ConfidenceBadge band={comp.confidence} />
        <ChevronRight className={`h-3 w-3 text-text-lo transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 w-full rounded-[6px] border border-hairline bg-void-2 p-3">
          <p className="mb-2 text-[12.5px] text-text-mid">{comp.confidenceReason}</p>
          <div className="space-y-1">
            {comp.confidenceFactors.map((f) => (
              <div key={f.label} className="flex items-center justify-between text-[12px]">
                <span className="text-text-lo">{f.label}</span>
                <span className="mono text-text-hi">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
