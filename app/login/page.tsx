"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Cube from "@/components/ui/Cube";
import CubeMark from "@/components/ui/CubeMark";
import ContourBg from "@/components/ui/ContourBg";
import { Button } from "@/components/ui/primitives";
import { GoogleIcon, MicrosoftIcon, GithubIcon, OktaIcon } from "@/components/ui/BrandIcons";
import { Mail, Lock, User, ArrowRight, ShieldCheck, KeyRound, Check, AlertCircle, Loader2 } from "lucide-react";

const PROVIDERS = [
  { key: "google", label: "Continue with Google", Icon: GoogleIcon },
  { key: "microsoft", label: "Continue with Microsoft", Icon: MicrosoftIcon },
  { key: "github", label: "Continue with GitHub", Icon: GithubIcon },
];

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/hr/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const emailValid = /.+@.+\..+/.test(email);
  const canSubmit = emailValid && password.length >= 6 && (mode === "signin" || consent);

  const submit = async () => {
    setError(null);
    setNotice(null);
    setBusy("email");
    try {
      const url = mode === "signin" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setBusy(null);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(null);
    }
  };

  const oauth = async (provider: string) => {
    setError(null);
    setNotice(null);
    setBusy(provider);
    try {
      const res = await fetch(`/api/auth/oauth/${provider}`, { redirect: "manual" });
      if (res.status === 501) {
        const data = await res.json();
        setNotice(`${data.error} ${data.detail ?? ""}`);
        setBusy(null);
        return;
      }
      // configured → perform the real redirect to the provider
      window.location.href = `/api/auth/oauth/${provider}`;
    } catch {
      setNotice("Couldn't reach the identity provider (this environment blocks outbound network). Use email + password below — that's fully working.");
      setBusy(null);
    }
  };

  return (
    <main className="relative flex min-h-screen bg-void text-text-hi">
      {/* Left showcase */}
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden border-r border-hairline lg:block">
        <ContourBg variant="contour" opacity={0.14} fade="center" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_40%_30%,rgba(123,147,255,0.12),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/" className="flex items-center gap-2.5">
            <CubeMark size={24} />
            <span className="wordmark text-sm text-text-hi">WhiteBox</span>
          </Link>
          <div className="flex flex-col items-center">
            <div className="animate-cube-float">
              <Cube size={150} />
            </div>
            <p className="mt-8 max-w-sm text-center text-[15px] leading-relaxed text-text-mid">
              The Explainable AI Hiring OS. You see every driver, every piece of evidence, and every human
              decision — written to a tamper-evident log.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Badge icon={ShieldCheck} label="SOC 2 · RBAC" />
            <Badge icon={KeyRound} label="SSO / SCIM" />
            <Badge icon={Check} label="EU AI Act ready" />
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <CubeMark size={24} />
              <span className="wordmark text-sm text-text-hi">WhiteBox</span>
            </Link>
          </div>

          <h1 className="h2 mb-1 text-text-hi">{mode === "signin" ? "Sign in" : "Create account"}</h1>
          <p className="mb-6 text-sm text-text-mid">
            {mode === "signin" ? "Welcome back to the HR workspace." : "Set up your recruiter workspace."}
          </p>

          <div className="space-y-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.key}
                onClick={() => oauth(p.key)}
                disabled={!!busy}
                className="flex w-full items-center gap-3 rounded-[8px] border border-hairline bg-surface px-4 py-2.5 text-[13.5px] text-text-hi transition-all hover:border-hairline-strong hover:bg-surface-2 disabled:opacity-50"
              >
                <p.Icon size={18} />
                <span className="flex-1 text-left">{p.label}</span>
                {busy === p.key ? <Loader2 className="h-3.5 w-3.5 animate-spin text-text-lo" /> : <ArrowRight className="h-3.5 w-3.5 text-text-lo" />}
              </button>
            ))}
          </div>

          {notice && (
            <div className="mt-3 flex items-start gap-2 rounded-md border px-3 py-2.5" style={{ borderColor: "rgba(232,169,59,0.35)", background: "rgba(232,169,59,0.06)" }}>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--warn)" }} />
              <p className="text-[12px] leading-relaxed text-text-mid">{notice}</p>
            </div>
          )}

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-hairline" />
            <span className="mono-label">or with email</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <div className="space-y-3">
            {mode === "signup" && <Field icon={User} type="text" placeholder="Full name" value={name} onChange={setName} />}
            <Field icon={Mail} type="email" placeholder="you@company.com" value={email} onChange={setEmail} />
            <Field icon={Lock} type="password" placeholder="Password (min 6 chars)" value={password} onChange={setPassword} onEnter={canSubmit ? submit : undefined} />

            {mode === "signup" && (
              <label className="flex cursor-pointer items-start gap-2 text-[12px] text-text-mid">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--iris-b)]" />
                I agree to the privacy terms and to AI-assisted evaluation.
              </label>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-[12.5px]" style={{ borderColor: "rgba(229,72,77,0.35)", background: "rgba(229,72,77,0.06)", color: "var(--neg)" }}>
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}

            <Button className="w-full" size="lg" disabled={!canSubmit || !!busy} onClick={submit}>
              {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </div>

          <p className="mt-6 text-center text-[12.5px] text-text-mid">
            {mode === "signin" ? "New to WhiteBox? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }} className="text-iris-b hover:underline">
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="mono mt-4 text-center text-[10.5px] text-text-lo">
            Email + password is backed by a real SQL database on this machine.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function Badge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-iris-b" />
      <span className="mono text-[11px] text-text-lo">{label}</span>
    </div>
  );
}

function Field({ icon: Icon, type, placeholder, value, onChange, onEnter }: { icon: React.ElementType; type: string; placeholder: string; value: string; onChange: (v: string) => void; onEnter?: () => void }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-lo" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
        className="h-11 w-full rounded-[8px] border border-hairline bg-surface pl-10 pr-3 text-[14px] text-text-hi outline-none placeholder:text-text-lo focus:border-hairline-strong"
      />
    </div>
  );
}
