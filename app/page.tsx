import Link from "next/link";
import Cube from "@/components/ui/Cube";
import { ArrowRight, ShieldCheck, ScanEye, GitBranch } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-void">
      {/* background layers */}
      <div className="pointer-events-none absolute inset-0 tex-grid opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(123,147,255,0.10),transparent_70%)]" />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <span className="inline-block h-3 w-3 border border-white/70" />
          <span className="wordmark text-sm text-text-hi">WhiteBox</span>
          <span className="mono-label mt-[2px] hidden sm:inline">
            · explainable ai hiring os
          </span>
        </div>
        <div className="mono-label">v1.0</div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto flex max-w-reading flex-col items-center px-6 pt-10 text-center md:pt-16">
        <div className="mb-6 animate-cube-float">
          <Cube size={132} />
        </div>

        <p className="mono-label mb-5">Vertical AI · built for fair hiring</p>
        <h1 className="h1 max-w-3xl text-balance text-text-hi">
          Not a faster black box —{" "}
          <span className="iris-text">a white one you can see into.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-text-mid">
          WhiteBox structures the evidence. The human decides. Every score shows
          its ranked drivers, its confidence as a phrase, the interview
          fragments behind it — and a mandatory human exit written to a
          hash-chained audit log.
        </p>

        {/* entry choice */}
        <div className="mt-12 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <Link
            href="/hr/dashboard"
            className="hud-card group relative rounded-md border border-hairline bg-surface p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-hairline-strong"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="mono-label">Recruiter product</span>
              <ArrowRight className="h-4 w-4 text-text-lo transition-transform group-hover:translate-x-1 group-hover:text-text-hi" />
            </div>
            <div className="h3 mb-1 text-text-hi">HR Workspace</div>
            <p className="text-sm text-text-mid">
              A dense instrument — ranking, scorecards, explainability, HITL
              override, bias & audit.
            </p>
          </Link>

          <Link
            href="/apply"
            className="hud-card group relative rounded-md border border-hairline bg-surface p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-hairline-strong"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="mono-label">Applicant product</span>
              <ArrowRight className="h-4 w-4 text-text-lo transition-transform group-hover:translate-x-1 group-hover:text-text-hi" />
            </div>
            <div className="h3 mb-1 text-text-hi">Candidate Portal</div>
            <p className="text-sm text-text-mid">
              Calm, anonymous, consent-first — code entry, adaptive AI interview,
              dignified status.
            </p>
          </Link>
        </div>

        {/* differentiator strip */}
        <div className="mt-16 grid w-full max-w-3xl gap-px overflow-hidden rounded-md border border-hairline bg-hairline sm:grid-cols-3">
          {[
            { icon: ScanEye, title: "Ranked drivers", body: "FICO-style reason codes — principal reason first." },
            { icon: ShieldCheck, title: "Confidence as a phrase", body: "Never a bare 82. A sentence you can act on." },
            { icon: GitBranch, title: "Hash-chained audit", body: "Every override, reason & version, tamper-evident." },
          ].map((f) => (
            <div key={f.title} className="bg-void-2 p-5 text-left">
              <f.icon className="mb-3 h-4 w-4 text-iris-b" />
              <div className="text-sm font-medium text-text-hi">{f.title}</div>
              <div className="mt-1 text-[13px] leading-relaxed text-text-lo">
                {f.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mx-auto mt-20 max-w-reading px-6 pb-10">
        <div className="hairline-t pt-5">
          <p className="mono-label">
            transparency · auditability · human-final-decision — the moat is not
            automation
          </p>
        </div>
      </footer>
    </main>
  );
}
