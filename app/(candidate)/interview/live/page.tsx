"use client";

/* AI Video Interview — Book IV · §5. The AI presence is the glowing cube,
   never a fake human face. This client talks to /api/ai/interview (stub with
   the real agent's contract); the realtime voice loop (LiveKit + STT/TTS)
   replaces the textarea without changing this page's structure. */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, MicOff, CircleHelp } from "lucide-react";
import { Cube } from "@/components/ui/primitives";
import { competitions, type Competition } from "@/lib/fixtures";
import type { InterviewStepResponse, InterviewTurn } from "@/lib/ai";

type Phase = "connecting" | "thinking" | "asking" | "answering" | "complete";

function LiveInterview() {
  const router = useRouter();
  const code = useSearchParams().get("code") ?? "WBX-3N8D";
  const [comp, setComp] = useState<Competition | null>(null);
  const [phase, setPhase] = useState<Phase>("connecting");
  const [history, setHistory] = useState<InterviewTurn[]>([]);
  const [current, setCurrent] = useState<InterviewStepResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);
  const historyRef = useRef<InterviewTurn[]>([]);

  useEffect(() => {
    const published = JSON.parse(localStorage.getItem("wbx-published") ?? "{}");
    const c: Competition | undefined = competitions[code] ?? published[code];
    if (!c) { router.replace("/"); return; }
    setComp(c);
  }, [code, router]);

  const step = useCallback(async (c: Competition) => {
    setPhase("thinking");
    setError(false);
    try {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacancyTitle: c.title, competencies: c.competencies, history: historyRef.current }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as InterviewStepResponse;
      setProgress(data.progress);
      setCurrent(data);
      if (data.done) {
        setPhase("complete");
      } else {
        const turn: InterviewTurn = { question: data.question!, topic: data.topic!, kind: data.kind! };
        historyRef.current = [...historyRef.current, turn];
        setHistory(historyRef.current);
        setPhase("answering");
      }
    } catch {
      setError(true);
      setPhase("answering");
    }
  }, []);

  useEffect(() => {
    if (!comp) return;
    const t = setTimeout(() => step(comp), 1400); // connecting → first question
    return () => clearTimeout(t);
  }, [comp, step]);

  const submit = () => {
    if (!comp || answer.trim().length === 0) return;
    historyRef.current = historyRef.current.map((t, i) =>
      i === historyRef.current.length - 1 ? { ...t, answer } : t,
    );
    setHistory(historyRef.current);
    setAnswer("");
    step(comp);
  };

  if (!comp) return null;
  const lastQ = history[history.length - 1];

  return (
    <div className="flex flex-1 flex-col items-center px-6 pb-8">
      <div className="hud-label mt-2">{comp.code} · {comp.title.toUpperCase()} · AI INTERVIEW</div>

      {/* gentle progress — approximate only, no countdown pressure */}
      <div className="mt-4 h-px w-full max-w-[640px] bg-white/8">
        <div className="h-px transition-all duration-700" style={{ width: `${Math.round(progress * 100)}%`, background: "var(--iris-gradient)" }} />
      </div>

      <div className="flex w-full max-w-[760px] flex-1 flex-col items-center justify-center py-6">
        {/* the AI presence — cube pulses while listening/thinking */}
        <div className={phase === "thinking" || phase === "connecting" ? "pulse-dot" : ""}>
          <Cube size={phase === "complete" ? 120 : 92} />
        </div>

        {phase === "connecting" && (
          <p className="mt-8 font-mono text-[11px] tracking-[0.1em] text-lo">CONNECTING · SETTING UP YOUR ROOM…</p>
        )}

        {phase === "thinking" && (
          <p className="mt-8 font-mono text-[11px] tracking-[0.1em] text-lo">…</p>
        )}

        {(phase === "answering" || phase === "thinking") && lastQ && (
          <div className="mt-8 w-full text-center">
            <div className="hud-label">{lastQ.kind === "followup" ? "FOLLOW-UP" : lastQ.topic.toUpperCase()}</div>
            <p className="mx-auto mt-3 max-w-[34ch] font-display text-[clamp(19px,2.4vw,26px)] font-medium leading-snug tracking-[-0.01em] text-hi">
              {lastQ.question}
            </p>
          </div>
        )}

        {phase === "answering" && (
          <div className="mt-8 w-full max-w-[640px]">
            {error && (
              <p className="mb-3 text-center text-[13px] text-warn">
                Connection hiccup — nothing was lost. Try sending again.
              </p>
            )}
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
              rows={4}
              autoFocus
              className="iris-focus w-full rounded-xl border border-hairline bg-surface p-4 text-[15px] leading-relaxed text-hi placeholder:text-lo"
              placeholder="Answer in your own words — real examples beat perfect phrasing… (voice mode arrives with the realtime stack)"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setMuted(!muted)} className="rounded-full border border-hairline p-2.5 text-mid hover:text-hi" aria-label="toggle microphone">
                  {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </button>
                <CircleHelp className="size-4 text-lo" />
                <span className="font-mono text-[10px] tracking-[0.06em] text-lo">NO TIME PRESSURE · ⌘↵ TO SEND</span>
              </div>
              <button
                onClick={submit}
                disabled={answer.trim().length === 0}
                className="rounded-lg border border-hairline-strong bg-surface2 px-6 py-2.5 text-[14px] text-hi transition-colors hover:border-irisb/50 disabled:opacity-35"
              >
                Send answer
              </button>
            </div>
          </div>
        )}

        {phase === "complete" && (
          <div className="mt-8 max-w-[52ch] text-center">
            <h1 className="font-display text-[clamp(22px,3vw,30px)] font-medium tracking-[-0.015em] text-hi">
              Interview complete
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-mid">{current?.closing}</p>
            <button
              onClick={() => router.push("/status")}
              className="mt-7 rounded-lg border border-hairline-strong bg-surface2 px-7 py-3 text-[15px] text-hi transition-colors hover:border-irisb/50"
            >
              Track my status
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LiveInterview />
    </Suspense>
  );
}
