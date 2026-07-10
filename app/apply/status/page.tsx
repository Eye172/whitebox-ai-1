"use client";

import { useState } from "react";
import CandidateShell from "@/components/candidate/CandidateShell";
import { CANDIDATE_STEPS } from "@/components/candidate/ProgressRail";
import { Check, Clock, Sparkles } from "lucide-react";

const STATUSES = ["Submitted", "Under review", "Invited to next stage"] as const;

export default function Status() {
  const [showInsight, setShowInsight] = useState(false);
  const current = 1; // "Under review"

  return (
    <CandidateShell step="done">
      <div className="pt-2">
        <h1 className="h3 mb-1 text-text-hi">Your application</h1>
        <p className="mb-6 text-[13px] text-text-mid">
          You were evaluated on your answers, with human review of the results.
        </p>

        {/* status */}
        <div className="mb-6 overflow-hidden rounded-md border border-hairline bg-surface">
          {STATUSES.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <div key={s} className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 last:border-0">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px]"
                  style={done ? { background: "rgba(70,208,138,0.16)", color: "var(--pos)" } : active ? { background: "var(--iris-b)", color: "#0b0b12" } : { border: "1px solid var(--hairline)", color: "var(--text-lo)" }}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : active ? <Clock className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`text-[14px] ${active ? "text-text-hi" : done ? "text-text-mid" : "text-text-lo"}`}>{s}</span>
                {active && <span className="mono ml-auto text-[11px] text-text-lo">in progress</span>}
              </div>
            );
          })}
        </div>

        {/* timeline */}
        <div className="mb-6">
          <div className="mono-label mb-2">Your completed steps</div>
          <div className="flex flex-wrap gap-1.5">
            {CANDIDATE_STEPS.slice(0, 6).map((s) => (
              <span key={s.key} className="mono flex items-center gap-1 rounded-full border border-hairline bg-surface px-2.5 py-1 text-[11px] text-text-mid">
                <Check className="h-3 w-3" style={{ color: "var(--pos)" }} /> {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* optional insight report */}
        <div className="rounded-md border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-iris-b" />
              <span className="text-[13.5px] text-text-hi">Insight report</span>
              <span className="mono-label">employer opted in</span>
            </div>
            <button onClick={() => setShowInsight((s) => !s)} className="mono text-[11px] text-iris-b hover:underline">
              {showInsight ? "hide" : "view"}
            </button>
          </div>
          {showInsight && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mono-label mb-2">Strengths</div>
                <ul className="space-y-1.5 text-[13px] text-text-hi">
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--pos)" }} />Clear, structured communication</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--pos)" }} />Strong decision-making under ambiguity</li>
                </ul>
              </div>
              <div>
                <div className="mono-label mb-2">Growth areas</div>
                <ul className="space-y-1.5 text-[13px] text-text-mid">
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--warn)" }} />Delegating earlier under pressure</li>
                </ul>
              </div>
              <p className="mono text-[11px] text-text-lo sm:col-span-2">No scores, no ranking — this is guidance, not a verdict.</p>
            </div>
          )}
        </div>

        <p className="mono mt-6 text-center text-[11px] text-text-lo">We&rsquo;ll notify you by email when your status changes.</p>
      </div>
    </CandidateShell>
  );
}
