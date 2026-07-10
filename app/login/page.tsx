"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cube from "@/components/ui/Cube";
import CubeMark from "@/components/ui/CubeMark";
import ContourBg from "@/components/ui/ContourBg";
import { Button } from "@/components/ui/primitives";
import { GoogleIcon, MicrosoftIcon, GithubIcon, OktaIcon } from "@/components/ui/BrandIcons";
import { signIn } from "@/lib/auth";
import { Mail, Lock, ArrowRight, Sparkles, ShieldCheck, KeyRound, Check } from "lucide-react";

const PROVIDERS = [
  { key: "google", label: "Continue with Google", Icon: GoogleIcon, name: "Riley Alvarez", email: "riley@acme.com" },
  { key: "microsoft", label: "Continue with Microsoft", Icon: MicrosoftIcon, name: "Riley Alvarez", email: "riley@acme.com" },
  { key: "github", label: "Continue with GitHub", Icon: GithubIcon, name: "Riley Alvarez", email: "riley@acme.com" },
  { key: "sso", label: "Continue with SSO / SAML", Icon: OktaIcon, name: "Riley Alvarez", email: "riley@acme.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [magic, setMagic] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const complete = (session: { name: string; email: string; provider: string }) => {
    setPending(session.provider);
    setTimeout(() => {
      signIn(session);
      router.push("/hr/dashboard");
    }, 650);
  };

  const emailValid = /.+@.+\..+/.test(email);
  const canSubmit = magic ? emailValid : emailValid && password.length >= 6 && (mode === "signin" || consent);

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
            {[
              [ShieldCheck, "SOC 2 · RBAC"],
              [KeyRound, "SSO / SCIM"],
              [Check, "EU AI Act ready"],
            ].map(([Icon, label], i) => (
              <div key={i} className="flex items-center gap-1.5">
                {/* @ts-expect-error icon component */}
                <Icon className="h-3.5 w-3.5 text-iris-b" />
                <span className="mono text-[11px] text-text-lo">{label as string}</span>
              </div>
            ))}
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

          {/* providers */}
          <div className="space-y-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.key}
                onClick={() => complete({ name: p.name, email: p.email, provider: p.key })}
                disabled={!!pending}
                className="flex w-full items-center gap-3 rounded-[8px] border border-hairline bg-surface px-4 py-2.5 text-[13.5px] text-text-hi transition-all hover:border-hairline-strong hover:bg-surface-2 disabled:opacity-50"
              >
                <p.Icon size={18} />
                <span className="flex-1 text-left">{p.label}</span>
                {pending === p.key ? (
                  <span className="mono text-[11px] text-text-lo">…</span>
                ) : (
                  <ArrowRight className="h-3.5 w-3.5 text-text-lo" />
                )}
              </button>
            ))}
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-hairline" />
            <span className="mono-label">or</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          {/* email / password */}
          {magicSent ? (
            <div className="rounded-md border border-hairline bg-surface p-4 text-center">
              <Mail className="mx-auto mb-2 h-5 w-5 text-iris-b" />
              <p className="text-[13.5px] text-text-hi">Magic link sent to {email}</p>
              <p className="mt-1 text-[12px] text-text-lo">Check your inbox — the link signs you in with no password.</p>
              <button onClick={() => complete({ name: "Riley Alvarez", email, provider: "magic-link" })} className="mono mt-3 text-[11px] text-iris-b hover:underline">
                simulate click →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Field icon={Mail} type="email" placeholder="you@company.com" value={email} onChange={setEmail} />
              {!magic && <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} />}

              {mode === "signup" && !magic && (
                <label className="flex cursor-pointer items-start gap-2 text-[12px] text-text-mid">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--iris-b)]" />
                  I agree to the privacy terms and to AI-assisted evaluation.
                </label>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!canSubmit || !!pending}
                onClick={() => {
                  if (magic) {
                    setMagicSent(true);
                    return;
                  }
                  complete({ name: "Riley Alvarez", email, provider: "password" });
                }}
              >
                {magic ? <><Sparkles className="h-4 w-4" /> Send magic link</> : mode === "signin" ? "Sign in" : "Create account"}
              </Button>

              <button onClick={() => setMagic((m) => !m)} className="mono w-full text-center text-[11.5px] text-text-lo hover:text-text-hi">
                {magic ? "use a password instead" : "email me a magic link instead"}
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-[12.5px] text-text-mid">
            {mode === "signin" ? "New to WhiteBox? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMagicSent(false); }} className="text-iris-b hover:underline">
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({ icon: Icon, type, placeholder, value, onChange }: { icon: React.ElementType; type: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-lo" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[8px] border border-hairline bg-surface pl-10 pr-3 text-[14px] text-text-hi outline-none placeholder:text-text-lo focus:border-hairline-strong"
      />
    </div>
  );
}
