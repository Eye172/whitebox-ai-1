"use client";

import React, { useMemo, useState } from "react";
import type { CategoryConfig, Candidate } from "@/lib/types";
import { Button } from "@/components/ui/primitives";
import { ChevronDown, Star, Plus, X, Sparkles, BookOpen, Check } from "lucide-react";

const TYPE_COLOR: Record<string, string> = {
  skill: "var(--iris-b)",
  trait: "var(--iris-c)",
  qualification: "var(--dune-gold)",
};

export default function CompetencyBuilder({
  categories: initial,
  candidates,
  threshold: initialThreshold,
}: {
  categories: CategoryConfig[];
  candidates: Candidate[];
  threshold: number;
}) {
  const [cats, setCats] = useState(initial.map((c) => ({ ...c })));
  const [threshold, setThreshold] = useState(initialThreshold);
  const [open, setOpen] = useState<Record<string, boolean>>(Object.fromEntries(initial.map((c) => [c.name, true])));
  const [saved, setSaved] = useState(false);

  const sum = cats.reduce((s, c) => s + c.weight, 0);
  const valid = sum === 100;

  const passCount = useMemo(() => candidates.filter((c) => c.overall >= threshold).length, [candidates, threshold]);

  const setWeight = (name: string, w: number) =>
    setCats((cs) => cs.map((c) => (c.name === name ? { ...c, weight: w } : c)));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* Left — hierarchy editor */}
      <div className="space-y-3">
        <div className="mono-label">Category → attribute hierarchy</div>
        {cats.map((cat) => (
          <div key={cat.name} className="overflow-hidden rounded-md border border-hairline bg-surface">
            <button onClick={() => setOpen((o) => ({ ...o, [cat.name]: !o[cat.name] }))} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/[0.02]">
              <ChevronDown className={`h-4 w-4 text-text-lo transition-transform ${open[cat.name] ? "" : "-rotate-90"}`} />
              <span className="flex-1 text-left text-[14px] font-medium text-text-hi">{cat.name}</span>
              <span className="mono text-[12px] text-text-mid">{cat.weight}%</span>
            </button>
            {open[cat.name] && (
              <div className="border-t border-hairline">
                {[...cat.attributes].sort((a, b) => Number(!!b.focus) - Number(!!a.focus)).map((attr) => (
                  <div key={attr.id} className={`flex items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-0 ${attr.focus ? "bg-[rgba(123,147,255,0.04)]" : ""}`}>
                    {attr.focus ? (
                      <Star className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--iris-b)", fill: "var(--iris-b)" }} />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="flex-1 text-[13px] text-text-hi">{attr.name}</span>
                    <span className="mono rounded-[4px] border border-hairline px-1.5 py-0.5 text-[10px] uppercase" style={{ color: TYPE_COLOR[attr.type ?? "skill"] }}>
                      {attr.type}
                    </span>
                    <span className="mono w-10 text-right text-[12px] text-text-mid">{attr.weight}%</span>
                    <button className="text-text-lo hover:text-neg"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button className="mono flex w-full items-center gap-1.5 px-4 py-2 text-[12px] text-text-lo hover:text-text-hi">
                  <Plus className="h-3.5 w-3.5" /> Add attribute
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="rounded-md border border-dashed border-hairline p-3 text-center">
          <button className="mono inline-flex items-center gap-1.5 text-[12px] text-text-lo hover:text-text-hi"><Plus className="h-3.5 w-3.5" /> Add category</button>
        </div>
      </div>

      {/* Right — controls */}
      <div className="space-y-4">
        {/* weights */}
        <div className="rounded-md border border-hairline bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="mono-label">Category weights</span>
            <span className="mono text-[12px]" style={{ color: valid ? "var(--pos)" : "var(--neg)" }}>
              {sum}% {valid ? "✓" : "· must = 100"}
            </span>
          </div>
          {cats.map((c) => (
            <div key={c.name} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="truncate text-[12.5px] text-text-mid">{c.name}</span>
                <span className="mono text-[12px] text-text-hi">{c.weight}%</span>
              </div>
              <input type="range" min={0} max={60} value={c.weight} onChange={(e) => setWeight(c.name, Number(e.target.value))} className="w-full accent-[var(--iris-b)]" />
            </div>
          ))}
        </div>

        {/* threshold */}
        <div className="rounded-md border border-hairline bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="mono-label">Minimum pass threshold</span>
            <span className="metric text-[18px] text-text-hi">{threshold}</span>
          </div>
          <input type="range" min={40} max={95} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-[var(--pos)]" />
          <div className="mt-2 rounded-[6px] border border-hairline bg-void-2 p-2 text-center">
            <span className="text-[12.5px] text-text-mid">≈ </span>
            <span className="mono text-[13px] text-text-hi">{passCount}</span>
            <span className="text-[12.5px] text-text-mid"> of {candidates.length} current candidates would pass</span>
          </div>
        </div>

        {/* interview settings (progressive disclosure) */}
        <div className="rounded-md border border-hairline bg-surface p-4">
          <div className="mono-label mb-3">Interview settings</div>
          <Row label="Type" value="Adaptive behavioural" />
          <Row label="Question depth" value="Deep (3–4 follow-ups)" />
          <Row label="Skill-check format" value="Scenario walkthrough" />
        </div>

        {/* question library */}
        <div className="rounded-md border border-hairline bg-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-iris-b" />
            <span className="mono-label">Question library</span>
          </div>
          <p className="mb-3 text-[12px] text-text-lo">Psychologically-validated questions, customizable per attribute.</p>
          <Button size="sm" variant="secondary" className="w-full">
            <Sparkles className="h-3.5 w-3.5" /> Auto-generate interview from config
          </Button>
        </div>

        <Button className="w-full" disabled={!valid} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}>
          {saved ? <><Check className="h-4 w-4" /> Saved as v4</> : "Save configuration"}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-2 text-[13px] last:border-0">
      <span className="text-text-mid">{label}</span>
      <span className="text-text-hi">{value}</span>
    </div>
  );
}
