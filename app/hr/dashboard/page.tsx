import Link from "next/link";
import Cube from "@/components/ui/Cube";
import CountUp from "@/components/ui/CountUp";
import { Button } from "@/components/ui/primitives";
import { VacancyCard } from "@/components/hr/VacancyCard";
import { VACANCIES, ORG_KPIS, CANDIDATES } from "@/lib/fixtures";
import ContourBg from "@/components/ui/ContourBg";
import { Plus, Download, ArrowRight, AlertTriangle, GitCompareArrows, Sparkles } from "lucide-react";

const KPIS = [
  { label: "Active vacancies", value: ORG_KPIS.activeVacancies, trend: 0 },
  { label: "Total candidates", value: ORG_KPIS.totalCandidates, trend: 12 },
  { label: "Passed threshold", value: ORG_KPIS.passedThreshold, trend: 8 },
  { label: "In invited list", value: ORG_KPIS.invited, trend: 3 },
  { label: "Avg score", value: ORG_KPIS.avgScore, trend: -2, suffix: "" },
  { label: "Open bias flags", value: ORG_KPIS.biasFlags, trend: 0, negative: true },
];

const ATTENTION = [
  { id: CANDIDATES[3]?.internalId, reason: "Score awaiting human review", kind: "review" as const },
  { id: CANDIDATES[6]?.internalId, reason: "AI↔human divergence on Communication", kind: "divergence" as const },
  { id: "Group C", reason: "Bias anomaly — 15pp pass-rate gap", kind: "bias" as const },
  { id: CANDIDATES[8]?.internalId, reason: "Low-confidence score needs review", kind: "review" as const },
];

export default function Dashboard() {
  return (
    <div className="relative overflow-hidden p-6 md:p-8">
      {/* contour texture behind header (data-map layer) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72"><ContourBg opacity={0.06} /></div>

      {/* Header row */}
      <div className="relative mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="h2 text-text-hi">Good morning, Rafael</h1>
          <p className="mono-label mt-1">Thursday · 10 July 2026</p>
          <div className="mt-5 flex gap-2">
            <Link href="/hr/vacancies/new">
              <Button size="md">
                <Plus className="h-4 w-4" /> Create vacancy
              </Button>
            </Link>
            <Button size="md" variant="secondary">
              <Download className="h-4 w-4" /> Import from ATS
            </Button>
          </div>
        </div>
        <div className="hidden shrink-0 md:block">
          <Cube size={92} />
        </div>
      </div>

      {/* KPI strip */}
      <div className="relative mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-md border border-hairline bg-surface p-4">
            <div className="mono-label mb-2 truncate">{k.label}</div>
            <div className="flex items-end justify-between gap-2">
              <CountUp
                to={k.value}
                className="metric text-[30px] leading-none"
              />
              {k.trend !== 0 && (
                <span className="mono text-[11px]" style={{ color: k.trend >= 0 ? "var(--pos)" : "var(--neg)" }}>
                  {k.trend >= 0 ? "▲" : "▼"} {Math.abs(k.trend)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* Vacancy cards */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-text-hi">Vacancies</h2>
            <span className="mono-label">sorted · recently updated</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {VACANCIES.map((v) => (
              <VacancyCard key={v.id} vacancy={v} />
            ))}
          </div>
        </section>

        {/* Needs your attention */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-text-hi">Needs your attention</h2>
            <span className="mono-label">HITL queue</span>
          </div>
          <div className="overflow-hidden rounded-md border border-hairline bg-surface">
            {ATTENTION.map((a, i) => {
              const Icon = a.kind === "bias" ? AlertTriangle : a.kind === "divergence" ? GitCompareArrows : Sparkles;
              const color = a.kind === "bias" ? "var(--neg)" : a.kind === "divergence" ? "var(--ember)" : "var(--iris-b)";
              const href = a.kind === "bias" ? "/hr/bias" : `/hr/vacancies/v-teamlead/candidates/${a.id}`;
              return (
                <Link
                  key={i}
                  href={href}
                  className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0 hover:bg-white/[0.02]"
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                  <div className="min-w-0 flex-1">
                    <div className="mono text-[12px] text-text-hi">{a.id}</div>
                    <div className="truncate text-[12.5px] text-text-mid">{a.reason}</div>
                  </div>
                  <span className="mono flex shrink-0 items-center gap-1 text-[11px] text-text-lo">
                    Review <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* trust motif note */}
          <div className="mt-4 rounded-md border border-hairline bg-void-2 p-4">
            <p className="mono-label mb-1">Human-in-the-loop</p>
            <p className="text-[12.5px] leading-relaxed text-text-mid">
              WhiteBox structures the evidence and ranks the drivers. Every
              decision here is yours — recorded, reasoned, and written to a
              hash-chained audit log.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
