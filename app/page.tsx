import Link from "next/link";
import Cube from "@/components/ui/Cube";
import CubeMark from "@/components/ui/CubeMark";
import ContourBg from "@/components/ui/ContourBg";
import { ArrowRight, ShieldCheck, ScanEye, GitBranch } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-void">
      {/* background layers */}
      <ContourBg variant="hud" opacity={0.12} fade="top" className="h-[720px]" />
      <div className="pointer-events-none absolute inset-0 tex-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_44%_at_50%_2%,rgba(123,147,255,0.12),transparent_66%)]" />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <CubeMark size={24} />
          <span className="wordmark text-sm text-text-hi">WhiteBox</span>
          <span className="mono-label mt-[2px] hidden sm:inline">· explainable ai hiring os</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/login" className="mono-label hidden hover:text-text-hi sm:inline">
            sign in
          </Link>
          <div className="mono-label">v1.0</div>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto flex max-w-reading flex-col items-center px-6 pt-8 text-center md:pt-12">
        {/* cube inside a HUD instrument frame (ref: particle-box wireframe + mono edge labels) */}
        <div className="relative mb-6 flex h-[320px] w-full max-w-2xl items-center justify-center">
          {/* frame */}
          <div className="pointer-events-none absolute inset-x-8 inset-y-2 rounded-md border border-hairline md:inset-x-24">
            <Corner className="left-[-1px] top-[-1px]" pos="tl" />
            <Corner className="right-[-1px] top-[-1px]" pos="tr" />
            <Corner className="bottom-[-1px] left-[-1px]" pos="bl" />
            <Corner className="bottom-[-1px] right-[-1px]" pos="br" />
          </div>
          {/* edge labels */}
          <span className="mono absolute left-2 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[10px] uppercase tracking-[0.2em] text-text-lo md:block">
            trust001 · security
          </span>
          <span className="mono absolute right-2 top-1/2 hidden -translate-y-1/2 rotate-90 text-[10px] uppercase tracking-[0.2em] text-text-lo md:block">
            layer 03 / 03 · resolved
          </span>
          <span className="mono absolute left-1/2 top-1 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.25em] text-text-lo md:block">
            wbx · brand object · glass cube
          </span>
          <span className="mono absolute bottom-1 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.25em] text-text-lo md:block">
            light passes through = explainability
          </span>
          <div className="animate-cube-float">
            <Cube size={150} />
          </div>
        </div>

        <p className="mono-label mb-5">Vertical AI · built for fair hiring</p>
        <h1 className="h1 max-w-3xl text-balance text-text-hi">
          Not a faster black box — <span className="iris-text">a white one you can see into.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-text-mid">
          WhiteBox structures the evidence. The human decides. Every score shows its ranked drivers, its
          confidence as a phrase, the interview fragments behind it — and a mandatory human exit written to a
          hash-chained audit log.
        </p>

        {/* entry choice */}
        <div className="mt-12 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <Link
            href="/login"
            className="hud-card group relative overflow-hidden rounded-md border border-hairline bg-surface/80 p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-hairline-strong"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="mono-label">Recruiter product</span>
              <ArrowRight className="h-4 w-4 text-text-lo transition-transform group-hover:translate-x-1 group-hover:text-text-hi" />
            </div>
            <div className="h3 mb-1 text-text-hi">HR Workspace</div>
            <p className="text-sm text-text-mid">
              A dense instrument — ranking, scorecards, explainability, HITL override, bias &amp; audit.
            </p>
          </Link>

          <Link
            href="/apply"
            className="hud-card group relative overflow-hidden rounded-md border border-hairline bg-surface/80 p-6 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-hairline-strong"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="mono-label">Applicant product</span>
              <ArrowRight className="h-4 w-4 text-text-lo transition-transform group-hover:translate-x-1 group-hover:text-text-hi" />
            </div>
            <div className="h3 mb-1 text-text-hi">Candidate Portal</div>
            <p className="text-sm text-text-mid">
              Calm, anonymous, consent-first — code entry, adaptive AI interview, dignified status.
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
              <div className="mt-1 text-[13px] leading-relaxed text-text-lo">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mx-auto mt-20 max-w-reading px-6 pb-10">
        <div className="hairline-t flex flex-wrap items-center justify-between gap-3 pt-5">
          <p className="mono-label">
            transparency · auditability · human-final-decision — the moat is not automation
          </p>
          <p className="mono-label">© 2026 whitebox ai</p>
        </div>
      </footer>
    </main>
  );
}

function Corner({ className = "", pos }: { className?: string; pos: "tl" | "tr" | "bl" | "br" }) {
  const borders = {
    tl: "border-l border-t",
    tr: "border-r border-t",
    bl: "border-l border-b",
    br: "border-r border-b",
  }[pos];
  return <span className={`absolute h-3 w-3 ${borders} border-iris-b/60 ${className}`} />;
}
