"use client";

/* Pre-Interview System Check (gate) — Book IV · §4.
   Device probes are stubbed with timed checks; the real implementation swaps
   each `runCheck` for WebRTC/MediaPipe probes — the gate logic stays. */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Mic, MonitorUp, Globe2, Wifi } from "lucide-react";

type CheckState = "pending" | "checking" | "ok" | "failed";

const CHECKS = [
  { id: "camera", label: "Camera", icon: Camera, hint: "Live preview will appear here" },
  { id: "mic", label: "Microphone", icon: Mic, hint: "Say something — we check the level" },
  { id: "browser", label: "Chromium-based browser", icon: Globe2, hint: "Required for the realtime interview" },
  { id: "connection", label: "Connection", icon: Wifi, hint: "Bandwidth check" },
  { id: "screen", label: "Screen share (optional, consented)", icon: MonitorUp, hint: "Advisory proctoring context only" },
] as const;

function SystemCheck() {
  const router = useRouter();
  const code = useSearchParams().get("code") ?? "WBX-3N8D";
  const [states, setStates] = useState<Record<string, CheckState>>(
    Object.fromEntries(CHECKS.map((c) => [c.id, "pending"])),
  );
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const c of CHECKS) {
        if (cancelled) return;
        setStates((s) => ({ ...s, [c.id]: "checking" }));
        await new Promise((r) => setTimeout(r, 550)); // real impl: device/WebRTC probe
        if (cancelled) return;
        setStates((s) => ({ ...s, [c.id]: "ok" }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const allOk = CHECKS.every((c) => states[c.id] === "ok");

  return (
    <div className="flex flex-1 flex-col items-center px-6 pb-10">
      <div className="hud-label mt-2">{code} · STEP 4 OF 7 · SYSTEM CHECK</div>
      <h1 className="mt-3 font-display text-[clamp(22px,3vw,30px)] font-medium tracking-[-0.015em] text-hi">
        Let's make sure everything works
      </h1>
      <p className="mt-2 text-[14px] text-mid">The interview starts only when every check passes. No surprises mid-way.</p>

      <div className="mt-8 w-full max-w-[560px] overflow-hidden rounded-xl border border-hairline bg-surface">
        {CHECKS.map((c) => {
          const st = states[c.id];
          return (
            <div key={c.id} className="flex items-center gap-4 border-b border-hairline px-5 py-4 last:border-b-0">
              <c.icon className="size-[18px] text-mid" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] text-hi">{c.label}</div>
                <div className="text-[12px] text-lo">{c.hint}</div>
              </div>
              {st === "checking" && <span className="pulse-dot size-2 rounded-full iris-line" />}
              {st === "ok" && (
                <span className="font-mono text-[10px] tracking-[0.08em] text-pos">OK</span>
              )}
              {st === "pending" && <span className="font-mono text-[10px] tracking-[0.08em] text-lo">—</span>}
            </div>
          );
        })}
      </div>

      {/* consent-first — explicit, plain-language */}
      <label className="mt-5 flex w-full max-w-[560px] cursor-pointer gap-3 rounded-xl border border-hairline bg-surface p-4">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 accent-white/80" />
        <span className="text-[12.5px] leading-relaxed text-mid">
          I understand this interview is AI-conducted. Integrity signals may be collected as{" "}
          <span className="text-hi">advisory context for human reviewers — never as automatic grounds for rejection</span>. My
          answers are evaluated anonymously until the final stage.
        </span>
      </label>

      <button
        onClick={() => router.push(`/interview/live?code=${code}`)}
        disabled={!allOk || !consent}
        className="mt-6 w-full max-w-[560px] rounded-lg border border-hairline-strong bg-surface2 py-3.5 text-[15px] text-hi transition-colors hover:border-irisb/50 disabled:cursor-not-allowed disabled:opacity-35"
      >
        Start interview
      </button>
      <p className="mt-3 font-mono text-[10px] tracking-[0.06em] text-lo">
        LIMITED RETAKES · COMPLETED STEPS NEVER EXPIRE
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SystemCheck />
    </Suspense>
  );
}
