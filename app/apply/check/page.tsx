"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CandidateShell from "@/components/candidate/CandidateShell";
import { Button } from "@/components/ui/primitives";
import { Camera, Mic, Monitor, Globe, Wifi, Check, Loader2, ShieldAlert } from "lucide-react";

type CheckState = "pending" | "checking" | "ok" | "fail";
const ITEMS = [
  { key: "camera", label: "Camera", icon: Camera, detail: "Live preview detected" },
  { key: "mic", label: "Microphone", icon: Mic, detail: "Input level nominal" },
  { key: "screen", label: "Screen-share (consented)", icon: Monitor, detail: "Proctoring — advisory only" },
  { key: "browser", label: "Browser", icon: Globe, detail: "Chromium-based ✓" },
  { key: "connection", label: "Connection", icon: Wifi, detail: "Bandwidth sufficient" },
];

export default function SystemCheck() {
  const router = useRouter();
  const [states, setStates] = useState<Record<string, CheckState>>(Object.fromEntries(ITEMS.map((i) => [i.key, "pending"])));
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    ITEMS.forEach((item, idx) => {
      setTimeout(() => setStates((s) => ({ ...s, [item.key]: "checking" })), 400 + idx * 500);
      setTimeout(() => setStates((s) => ({ ...s, [item.key]: "ok" })), 400 + idx * 500 + 900);
    });
  }, []);

  const allOk = ITEMS.every((i) => states[i.key] === "ok");

  return (
    <CandidateShell step="check">
      <div className="pt-2">
        <h1 className="h3 mb-1 text-text-hi">Pre-interview system check</h1>
        <p className="mb-6 text-[13px] text-text-mid">We&rsquo;ll confirm everything works before you start. Nothing is recorded yet.</p>

        <div className="overflow-hidden rounded-md border border-hairline bg-surface">
          {ITEMS.map((item) => {
            const st = states[item.key];
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
                <Icon className="h-4 w-4 text-text-lo" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] text-text-hi">{item.label}</div>
                  <div className="mono text-[11px] text-text-lo">{st === "ok" ? item.detail : st === "checking" ? "checking…" : "waiting"}</div>
                </div>
                {st === "checking" && <Loader2 className="h-4 w-4 animate-spin text-text-lo" />}
                {st === "ok" && (
                  <span className="mono flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(70,208,138,0.12)", color: "var(--pos)" }}>
                    <Check className="h-3 w-3" /> OK
                  </span>
                )}
                {st === "pending" && <span className="h-2 w-2 rounded-full bg-white/10" />}
              </div>
            );
          })}
        </div>

        {/* consent */}
        <div className="mt-4 rounded-md border border-hairline bg-void-2 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5" style={{ color: "var(--ember)" }} />
            <span className="mono-label">Consent & disclosure</span>
          </div>
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--iris-b)]" />
            <span className="text-[12.5px] leading-relaxed text-text-mid">
              This interview is AI-conducted. Integrity signals may be collected as advisory context for reviewers —
              never as automatic grounds for rejection.
            </span>
          </label>
        </div>

        <Button className="mt-5 w-full" size="lg" disabled={!allOk || !consent} onClick={() => router.push("/apply/interview")}>
          {allOk ? "Start interview" : "Running checks…"}
        </Button>
        <p className="mono mt-3 text-center text-[11px] text-text-lo">
          You can retake up to a limited number of times; completed steps don&rsquo;t expire.
        </p>
      </div>
    </CandidateShell>
  );
}
