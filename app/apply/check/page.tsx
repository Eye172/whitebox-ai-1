"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CandidateShell from "@/components/candidate/CandidateShell";
import { Button } from "@/components/ui/primitives";
import { Camera, Mic, Monitor, Globe, Wifi, Check, Loader2, ShieldAlert, X, RotateCw } from "lucide-react";

type CheckState = "pending" | "checking" | "ok" | "fail";

export default function SystemCheck() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const [camera, setCamera] = useState<CheckState>("pending");
  const [mic, setMic] = useState<CheckState>("pending");
  const [screen, setScreen] = useState<CheckState>("pending");
  const [browser, setBrowser] = useState<CheckState>("pending");
  const [connection, setConnection] = useState<CheckState>("pending");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const startDevices = useCallback(async () => {
    setError(null);
    setCamera("checking");
    setMic("checking");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamera(stream.getVideoTracks().length ? "ok" : "fail");
      setMic(stream.getAudioTracks().length ? "ok" : "fail");

      // live mic level meter via Web Audio
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setLevel(Math.min(1, sum / data.length / 90));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      const err = e as DOMException;
      setCamera("fail");
      setMic("fail");
      setError(
        err.name === "NotAllowedError"
          ? "Camera & microphone permission was blocked. Click the camera icon in your browser's address bar to allow, then retry."
          : err.name === "NotFoundError"
          ? "No camera or microphone was found. Connect a device and retry."
          : "Couldn't access your devices. Make sure no other app is using the camera, then retry."
      );
    }
  }, []);

  const enableScreenShare = async () => {
    setScreen("checking");
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = s;
      s.getVideoTracks()[0]?.addEventListener("ended", () => setScreen("pending"));
      setScreen("ok");
    } catch {
      setScreen("fail");
    }
  };

  // browser + connection checks (real)
  useEffect(() => {
    const ua = navigator.userAgent;
    const isChromium = /Chrome|Chromium|Edg|Brave/.test(ua) && !/Firefox/.test(ua);
    setBrowser(isChromium ? "ok" : "fail");

    const nav = navigator as Navigator & { connection?: { downlink?: number; effectiveType?: string } };
    const c = nav.connection;
    if (c && typeof c.downlink === "number") {
      setConnection(c.downlink >= 1 ? "ok" : "fail");
    } else {
      setConnection("ok"); // no API → assume sufficient
    }

    startDevices();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [startDevices]);

  const coreOk = camera === "ok" && mic === "ok" && browser === "ok" && connection === "ok";

  return (
    <CandidateShell step="check" wide>
      <div className="mx-auto max-w-3xl pt-2">
        <h1 className="h3 mb-1 text-text-hi">Pre-interview system check</h1>
        <p className="mb-6 text-[13px] text-text-mid">
          We&rsquo;ll confirm your camera and microphone work before you start. Nothing is recorded yet.
        </p>

        <div className="grid gap-5 md:grid-cols-[300px_1fr]">
          {/* live camera preview */}
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-hairline bg-void-2">
              <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
              {camera !== "ok" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                  {camera === "checking" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-text-lo" />
                  ) : (
                    <Camera className="h-6 w-6 text-text-lo" />
                  )}
                  <span className="mono px-4 text-[10px] text-text-lo">
                    {camera === "checking" ? "requesting camera…" : "camera preview"}
                  </span>
                </div>
              )}
              {camera === "ok" && (
                <span className="mono absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--pos)" }} /> live
                </span>
              )}
            </div>
            {/* mic level meter */}
            <div className="mt-3">
              <div className="mono-label mb-1.5 flex items-center gap-1.5">
                <Mic className="h-3 w-3" /> mic level {mic === "ok" ? "· speak to test" : ""}
              </div>
              <div className="flex gap-[3px]">
                {Array.from({ length: 20 }).map((_, i) => {
                  const active = level * 20 > i;
                  return (
                    <div
                      key={i}
                      className="h-4 flex-1 rounded-[1px] transition-colors"
                      style={{ background: active ? (i > 15 ? "var(--warn)" : "var(--pos)") : "rgba(255,255,255,0.08)" }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* checklist */}
          <div>
            <div className="overflow-hidden rounded-md border border-hairline bg-surface">
              <CheckRow icon={Camera} label="Camera" state={camera} okText="Live preview detected" />
              <CheckRow icon={Mic} label="Microphone" state={mic} okText="Input detected" />
              <CheckRow icon={Globe} label="Browser" state={browser} okText="Chromium-based ✓" failText="Chromium browser required" />
              <CheckRow icon={Wifi} label="Connection" state={connection} okText="Bandwidth sufficient" />
              <CheckRow
                icon={Monitor}
                label="Screen-share (optional, consented)"
                state={screen}
                okText="Sharing — advisory proctoring"
                pendingSlot={
                  <button onClick={enableScreenShare} className="mono rounded-[6px] border border-hairline px-2 py-1 text-[10px] text-text-mid hover:text-text-hi">
                    enable
                  </button>
                }
              />
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-md border px-3 py-2.5" style={{ borderColor: "rgba(229,72,77,0.35)", background: "rgba(229,72,77,0.06)" }}>
                <X className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--neg)" }} />
                <div className="flex-1">
                  <p className="text-[12.5px] text-text-mid">{error}</p>
                  <button onClick={startDevices} className="mono mt-1.5 inline-flex items-center gap-1 text-[11px] text-iris-b hover:underline">
                    <RotateCw className="h-3 w-3" /> retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* consent */}
        <div className="mt-5 rounded-md border border-hairline bg-void-2 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5" style={{ color: "var(--ember)" }} />
            <span className="mono-label">Consent & disclosure</span>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--iris-b)]" />
            <span className="text-[12.5px] leading-relaxed text-text-mid">
              This interview is AI-conducted. Integrity signals may be collected as advisory context for reviewers —
              never as automatic grounds for rejection.
            </span>
          </label>
        </div>

        <Button className="mt-5 w-full" size="lg" disabled={!coreOk || !consent} onClick={() => router.push("/apply/interview")}>
          {coreOk ? "Start interview" : "Complete the checks to continue"}
        </Button>
        <p className="mono mt-3 text-center text-[11px] text-text-lo">
          You can retake up to a limited number of times; completed steps don&rsquo;t expire.
        </p>
      </div>
    </CandidateShell>
  );
}

function CheckRow({
  icon: Icon,
  label,
  state,
  okText,
  failText,
  pendingSlot,
}: {
  icon: React.ElementType;
  label: string;
  state: CheckState;
  okText: string;
  failText?: string;
  pendingSlot?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
      <Icon className="h-4 w-4 text-text-lo" />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] text-text-hi">{label}</div>
        <div className="mono text-[11px] text-text-lo">
          {state === "ok" ? okText : state === "checking" ? "checking…" : state === "fail" ? failText ?? "failed" : "waiting"}
        </div>
      </div>
      {state === "checking" && <Loader2 className="h-4 w-4 animate-spin text-text-lo" />}
      {state === "ok" && (
        <span className="mono flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(70,208,138,0.12)", color: "var(--pos)" }}>
          <Check className="h-3 w-3" /> OK
        </span>
      )}
      {state === "fail" && (
        <span className="mono flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(229,72,77,0.12)", color: "var(--neg)" }}>
          <X className="h-3 w-3" /> failed
        </span>
      )}
      {state === "pending" && (pendingSlot ?? <span className="h-2 w-2 rounded-full bg-white/10" />)}
    </div>
  );
}
