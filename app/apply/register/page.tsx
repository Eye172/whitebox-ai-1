"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CandidateShell from "@/components/candidate/CandidateShell";
import { WhiteBoxPanel } from "@/components/ui/WhiteBox";
import { Button } from "@/components/ui/primitives";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <CandidateShell step="register">
        <div className="pt-4">
          <WhiteBoxPanel label="Your anonymous identity" className="p-7">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(70,208,138,0.14)" }}>
              <ShieldCheck className="h-5 w-5" style={{ color: "#1f8f5c" }} />
            </div>
            <h2 className="mb-2 text-[19px] font-semibold" style={{ color: "var(--wb-text)" }}>
              You&rsquo;ve been assigned an anonymous ID
            </h2>
            <p className="mb-4 text-[14px] leading-relaxed" style={{ color: "rgba(23,23,26,0.7)" }}>
              From here, evaluators see only your answers — not your name, photo, gender, or age — until the final stage.
              This is the transparent box you&rsquo;re entering: you&rsquo;re judged on what you say, not who you are.
            </p>
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border px-3 py-1.5" style={{ borderColor: "rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.5)" }}>
              <span className="mono text-[13px]" style={{ color: "var(--wb-text)" }}>CND-8F2A</span>
              <span className="text-[11px]" style={{ color: "rgba(23,23,26,0.5)" }}>· your internal ID</span>
            </div>
            <div>
              <button
                onClick={() => router.push("/apply/profile")}
                className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13.5px] font-medium text-white"
                style={{ background: "#17171a" }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </WhiteBoxPanel>
        </div>
      </CandidateShell>
    );
  }

  return (
    <CandidateShell step="register">
      <div className="pt-6">
        <div className="mb-6 flex justify-center gap-1">
          {(["signup", "login"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`mono rounded-[6px] px-4 py-1.5 text-[12px] ${mode === m ? "bg-white/[0.05] text-text-hi" : "text-text-lo hover:text-text-mid"}`}
            >
              {m === "signup" ? "Sign up" : "Log in"}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-sm space-y-3">
          <Field label="Email" type="email" placeholder="you@example.com" />
          <Field label="Password" type="password" placeholder="••••••••" />
          {mode === "signup" && (
            <label className="flex items-start gap-2.5 pt-1">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--iris-b)]" />
              <span className="text-[12.5px] leading-relaxed text-text-mid">
                I agree to the privacy terms and to AI-assisted evaluation. I understand integrity signals may be collected as advisory context.
              </span>
            </label>
          )}
          <Button
            className="w-full"
            size="lg"
            disabled={mode === "signup" && !consent}
            onClick={() => (mode === "signup" ? setDone(true) : router.push("/apply/profile"))}
          >
            {mode === "signup" ? "Create account" : "Log in"}
          </Button>
          <p className="mono pt-2 text-center text-[11px] text-text-lo">Magic-link & SSO supported</p>
        </div>
      </div>
    </CandidateShell>
  );
}

function Field({ label, type, placeholder }: { label: string; type: string; placeholder: string }) {
  return (
    <div>
      <label className="mono-label mb-1.5 block">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-[8px] border border-hairline bg-surface px-3 py-2.5 text-[14px] text-text-hi outline-none placeholder:text-text-lo focus:border-hairline-strong"
      />
    </div>
  );
}
