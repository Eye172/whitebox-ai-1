"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CandidateShell from "@/components/candidate/CandidateShell";
import Cube from "@/components/ui/Cube";
import { Button } from "@/components/ui/primitives";
import { Mic, MicOff, Pause, HelpCircle, Captions, Check, CameraOff } from "lucide-react";

const SCRIPT = [
  { q: "To start — tell me about a time you led a team through real ambiguity.", follow: false },
  { q: "You mentioned resetting the team around outcomes. How did you actually measure whether morale improved?", follow: true },
  { q: "Let's switch. Walk me through a decision you made with incomplete data that you'd defend today.", follow: false },
  { q: "Interesting — was that a reversible decision? Would you have moved faster if it were?", follow: true },
  { q: "Last one. Describe feedback that genuinely changed how you work.", follow: false },
];

type Phase = "connecting" | "asking" | "listening" | "thinking" | "done";

export default function Interview() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("connecting");
  const [i, setI] = useState(0);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase("asking"), 2200);
    // real self-view camera
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCamOn(true);
      } catch {
        setCamOn(false);
      }
    })();
    return () => {
      clearTimeout(t);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  // mute toggles the real audio track
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }, [muted]);

  useEffect(() => {
    if (phase === "asking") {
      const t = setTimeout(() => setPhase("listening"), 1600);
      return () => clearTimeout(t);
    }
    if (phase === "thinking") {
      const t = setTimeout(() => {
        if (i + 1 >= SCRIPT.length) setPhase("done");
        else {
          setI((n) => n + 1);
          setPhase("asking");
        }
      }, 1900);
      return () => clearTimeout(t);
    }
  }, [phase, i]);

  const progress = Math.round(((i + (phase === "done" ? 1 : 0)) / SCRIPT.length) * 100);

  if (phase === "done") {
    return (
      <CandidateShell step="interview" reassure={false}>
        <div className="flex flex-col items-center pt-10 text-center">
          <div className="mb-6"><Cube size={90} /></div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(70,208,138,0.14)" }}>
            <Check className="h-5 w-5" style={{ color: "var(--pos)" }} />
          </div>
          <h1 className="h3 mb-2 text-text-hi">Interview complete</h1>
          <p className="mb-6 max-w-md text-[14px] text-text-mid">
            Thank you. Your responses are being assessed across dozens of competencies, each with reasoning tied to what you said.
            You&rsquo;ll never be scored by the AI alone — a human reviews the results.
          </p>
          <Button size="lg" onClick={() => router.push("/apply/documents")}>Continue to documents</Button>
        </div>
      </CandidateShell>
    );
  }

  return (
    <CandidateShell step="interview" reassure={false} wide>
      <div className="pt-2">
        {/* progress */}
        <div className="mb-6">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="mono-label">Adaptive interview · human-paced</span>
            <span className="mono text-[11px] text-text-lo">~{progress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/5">
            <div className="iris-bar h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          {/* AI presence */}
          <div className="relative flex min-h-[300px] flex-col items-center justify-center rounded-md border border-hairline bg-void-2 p-6">
            <div className="pointer-events-none absolute inset-0 tex-grid opacity-30" />
            <div className="relative">
              <Cube size={96} pulse={phase === "listening" || phase === "thinking"} />
            </div>
            <div className="relative mt-4 text-center">
              <div className="mono-label">
                {phase === "connecting" && "connecting…"}
                {phase === "asking" && "WhiteBox is speaking"}
                {phase === "listening" && "listening — your turn"}
                {phase === "thinking" && "thinking…"}
              </div>
            </div>
            {/* self view — real camera */}
            <div className="absolute bottom-3 right-3 flex h-20 w-28 items-center justify-center overflow-hidden rounded-[6px] border border-hairline bg-surface">
              <video ref={videoRef} muted playsInline className={`h-full w-full -scale-x-100 object-cover ${camOn ? "" : "hidden"}`} />
              {!camOn && (
                <div className="flex flex-col items-center gap-1">
                  <CameraOff className="h-3.5 w-3.5 text-text-lo" />
                  <span className="mono text-[9px] text-text-lo">you</span>
                </div>
              )}
              {camOn && <span className="mono absolute left-1 top-1 rounded bg-black/50 px-1 text-[8px] text-white">you</span>}
              {muted && <MicOff className="absolute bottom-1 right-1 h-3 w-3" style={{ color: "var(--neg)" }} />}
            </div>
          </div>

          {/* question + controls */}
          <div className="flex flex-col">
            <div className="flex-1 rounded-md border border-hairline bg-surface p-6">
              {phase === "connecting" ? (
                <div className="flex h-full items-center justify-center">
                  <span className="mono text-[12px] text-text-lo">establishing secure room…</span>
                </div>
              ) : (
                <>
                  {SCRIPT[i].follow && (
                    <span className="mono-label mb-3 inline-block rounded-full bg-white/[0.05] px-2 py-0.5">follow-up</span>
                  )}
                  <p className="text-[20px] leading-relaxed text-text-hi transition-opacity duration-300" style={{ opacity: phase === "asking" || phase === "listening" ? 1 : 0.4 }}>
                    {SCRIPT[i].q}
                  </p>
                  {captions && phase === "listening" && (
                    <p className="mono mt-6 text-[12px] leading-relaxed text-text-lo">
                      <span className="text-iris-b">live captions ·</span> your response is being transcribed…
                    </p>
                  )}
                </>
              )}
            </div>

            {/* controls */}
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setMuted((m) => !m)} className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface text-text-mid hover:text-text-hi" title="Mute">
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button onClick={() => setCaptions((c) => !c)} className={`flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface hover:text-text-hi ${captions ? "text-iris-b" : "text-text-mid"}`} title="Captions">
                <Captions className="h-4 w-4" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface text-text-mid hover:text-text-hi" title="Pause">
                <Pause className="h-4 w-4" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface text-text-mid hover:text-text-hi" title="Help">
                <HelpCircle className="h-4 w-4" />
              </button>
              <div className="ml-auto">
                {phase === "listening" && (
                  <Button size="md" onClick={() => setPhase("thinking")}>
                    Done answering
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mono mt-5 text-center text-[11px] text-text-lo">
          Each interview is built individually from your answers — there&rsquo;s no universal set to prepare.
        </p>
      </div>
    </CandidateShell>
  );
}
