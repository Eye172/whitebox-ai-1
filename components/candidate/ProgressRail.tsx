"use client";

import { Check } from "lucide-react";

export const CANDIDATE_STEPS = [
  { key: "code", label: "Code" },
  { key: "register", label: "Register" },
  { key: "profile", label: "Profile" },
  { key: "check", label: "System check" },
  { key: "interview", label: "Interview" },
  { key: "documents", label: "Documents" },
  { key: "done", label: "Done" },
];

export default function ProgressRail({ current }: { current: string }) {
  const idx = CANDIDATE_STEPS.findIndex((s) => s.key === current);
  return (
    <div className="border-b border-hairline bg-void/70 glass-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-1 px-6 py-3">
        {/* mobile compact */}
        <div className="mono text-[11px] text-text-mid sm:hidden">
          Step {idx + 1} of {CANDIDATE_STEPS.length} · {CANDIDATE_STEPS[idx]?.label}
        </div>
        {/* desktop stepper */}
        <div className="hidden w-full items-center sm:flex">
          {CANDIDATE_STEPS.map((s, i) => {
            const done = i < idx;
            const active = i === idx;
            return (
              <div key={s.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                      done
                        ? "border-transparent"
                        : active
                        ? "border-transparent"
                        : "border-hairline text-text-lo"
                    }`}
                    style={
                      done
                        ? { background: "rgba(70,208,138,0.16)", color: "var(--pos)" }
                        : active
                        ? { background: "var(--iris-b)", color: "#0b0b12" }
                        : {}
                    }
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span
                    className={`mono text-[11px] ${active ? "text-text-hi" : done ? "text-text-mid" : "text-text-lo"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < CANDIDATE_STEPS.length - 1 && (
                  <span className="mx-2 h-px flex-1" style={{ background: i < idx ? "rgba(70,208,138,0.35)" : "var(--hairline)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
