import Link from "next/link";
import { MoreHorizontal, ArrowRight } from "lucide-react";
import { kpis, vacancies, attentionQueue } from "@/lib/fixtures";
import { Cube, KpiTile, StatusPill } from "@/components/ui/primitives";

const queueTone = { review: "var(--warn)", flag: "var(--neg)", divergence: "var(--iris-b)", bias: "var(--neg)" } as const;

function MiniFunnel({ funnel }: { funnel: number[] }) {
  const max = funnel[0] || 1;
  return (
    <div className="flex h-6 items-end gap-1" aria-label="hiring funnel">
      {funnel.map((v, i) => (
        <span key={i} className="w-5 rounded-[1px] bg-white/10" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="contour-bg p-8">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-[28px] font-medium tracking-[-0.02em] text-hi">Good morning, Aizhan</h1>
          <div className="hud-label mt-1.5">FRI · 2026-07-18 · WORKSPACE ACME</div>
        </div>
        <div className="flex items-center gap-6">
          <Cube size={88} />
          <div className="flex gap-2.5">
            <Link href="/vacancies/new" className="brackets rounded border border-hairline-strong bg-surface2 px-4 py-2 text-[13px] text-hi transition-colors hover:border-irisb/50">
              Create Vacancy
            </Link>
            <button className="rounded border border-hairline px-4 py-2 text-[13px] text-mid hover:text-hi">
              Import from ATS
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-8 grid grid-cols-6 gap-3">
        {kpis.map((k) => (
          <KpiTile key={k.label} {...k} />
        ))}
      </div>

      {/* Body: vacancy cards + attention queue */}
      <div className="mt-8 grid grid-cols-[64fr_36fr] gap-6">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium text-hi">Vacancies</h2>
            <span className="hud-label">SORT · RECENT</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {vacancies.map((v) => (
              <Link
                key={v.id}
                href={`/vacancies/${v.id}/ranking`}
                className={`brackets card-hover group rounded-xl border border-hairline bg-surface p-5 ${v.status === "CLOSED" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-medium text-hi">{v.title}</div>
                    <div className="mt-1 flex items-center gap-2.5">
                      <StatusPill label={v.status} />
                      <span className="font-mono text-[11px] tracking-[0.06em] text-lo">{v.code}</span>
                      <span className="font-mono text-[11px] text-lo">v{v.configVersion}</span>
                    </div>
                  </div>
                  <MoreHorizontal className="size-4 text-lo" />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <span className="tnum text-[22px] font-medium text-hi">{v.candidates}</span>
                    <span className="ml-1.5 text-[12px] text-lo">candidates</span>
                    {v.needReview > 0 && (
                      <span className="ml-3 whitespace-nowrap rounded-full bg-warn/10 px-2 py-0.5 font-mono text-[10px] text-warn">
                        {v.needReview} NEED REVIEW
                      </span>
                    )}
                  </div>
                  <MiniFunnel funnel={v.funnel} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium text-hi">Needs your attention</h2>
            <span className="hud-label">HITL QUEUE</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
            {attentionQueue.map((q, i) => (
              <Link
                key={q.id + i}
                href={q.id.startsWith("CND") ? `/vacancies/vac-001/candidates/${q.id}` : "/bias"}
                className="group flex items-center gap-3 border-b border-hairline px-4 py-3.5 last:border-b-0 hover:bg-white/[0.03]"
              >
                <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: queueTone[q.kind] }} />
                <span className="font-mono text-[12px] text-hi">{q.id}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-mid">{q.reason}</span>
                <span className="flex items-center gap-1 text-[12px] text-lo group-hover:text-hi">
                  Review <ArrowRight className="size-3" />
                </span>
              </Link>
            ))}
          </div>

          {/* Trust strip — the human decides */}
          <div className="relative mt-4 overflow-hidden rounded-xl border border-hairline">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{ backgroundImage: "url(/textures/halftone-hand.jpeg)" }}
            />
            <div className="relative p-5">
              <div className="hud-label">TRUST001 · HUMAN-IN-THE-LOOP</div>
              <p className="mt-2 max-w-[36ch] text-[13px] leading-relaxed text-mid">
                The AI structures information. <span className="font-serif text-hi">You</span> make every final decision —
                and every decision is written to the audit chain.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
