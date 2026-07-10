"use client";

import React, { useState } from "react";
import type { CompetencyScore } from "@/lib/types";
import { ConfidenceExpand, DriverList, EvidenceChips, ReasoningTrace } from "@/components/ui/explain";
import { ScoreCell } from "@/components/ui/primitives";
import { ChevronDown, BadgeCheck, Boxes } from "lucide-react";

export default function CompetencyBlock({
  comp,
  threshold,
  defaultOpen = false,
}: {
  comp: CompetencyScore;
  threshold: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-md border border-hairline bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        <Boxes className={`h-4 w-4 shrink-0 transition-colors ${open ? "text-iris-c" : "text-text-lo"}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-text-hi">{comp.name}</span>
            {comp.docVerified && (
              <span title="A claim behind this was document-verified" className="inline-flex">
                <BadgeCheck className="h-3.5 w-3.5" style={{ color: "var(--pos)" }} />
              </span>
            )}
          </div>
          <span className="mono-label">{comp.category} · weight {comp.weight}%</span>
        </div>
        <div className="hidden w-32 sm:block">
          <ScoreCell score={comp.score} threshold={threshold} />
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-lo transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="grid gap-5 border-t border-hairline px-4 py-4 lg:grid-cols-[1.4fr_1fr]">
          {/* left: drivers + reasoning (unfolds the cube's layers) */}
          <div className="space-y-4">
            <div>
              <div className="mono-label mb-2">Ranked drivers · principal reason first</div>
              <DriverList drivers={comp.drivers} />
            </div>
            <div>
              <div className="mono-label mb-2">Reasoning trace</div>
              <ReasoningTrace steps={comp.reasoning} />
            </div>
          </div>
          {/* right: confidence + evidence */}
          <div className="space-y-4">
            <div className="sm:hidden">
              <ScoreCell score={comp.score} threshold={threshold} />
            </div>
            <div>
              <div className="mono-label mb-2">Confidence</div>
              <ConfidenceExpand comp={comp} />
            </div>
            <div>
              <div className="mono-label mb-2">Evidence</div>
              <EvidenceChips evidence={comp.evidence} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
