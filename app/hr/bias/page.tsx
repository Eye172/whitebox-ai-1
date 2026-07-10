import { BIAS_GROUPS, BIAS_ALERTS } from "@/lib/fixtures";
import { PageHeader, Section } from "@/components/hr/PageHeader";
import { BarRow } from "@/components/ui/viz";
import { AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function BiasPage() {
  const maxN = Math.max(...BIAS_GROUPS.map((g) => g.n));
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Bias monitor"
        sub="Post-hoc, anonymization-respecting fairness metrics. Red is reserved strictly for anomalies."
        right={
          <span className="mono flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1 text-[11px] text-text-mid">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--pos)" }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--pos)" }} />
            </span>
            monitoring active
          </span>
        }
      />

      {/* alerts */}
      {BIAS_ALERTS.length > 0 ? (
        <div className="mb-8 space-y-2">
          {BIAS_ALERTS.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-md border px-4 py-3" style={{ borderColor: "rgba(229,72,77,0.35)", background: "rgba(229,72,77,0.06)" }}>
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--neg)" }} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] text-text-hi">{a.metric} anomaly</div>
                <div className="text-[12.5px] text-text-mid">{a.message}</div>
              </div>
              <Link href="/hr/vacancies/v-teamlead/ranking" className="mono flex shrink-0 items-center gap-1 text-[11px]" style={{ color: "var(--neg)" }}>
                {a.affected} affected <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-8 flex items-center gap-2 rounded-md border border-hairline bg-surface px-4 py-3">
          <ShieldCheck className="h-4 w-4" style={{ color: "var(--pos)" }} />
          <span className="text-[13px] text-text-mid">No anomalies detected.</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Pass rate by group" desc="Demographic parity — gaps flagged in red">
          <div className="rounded-md border border-hairline bg-surface p-5">
            {BIAS_GROUPS.map((g) => (
              <BarRow
                key={g.group}
                label={`${g.group} (n=${g.n})`}
                value={Math.round(g.passRate * 100)}
                suffix="%"
                color={g.anomaly ? "var(--neg)" : "var(--pos)"}
              />
            ))}
          </div>
        </Section>

        <Section title="Average score by group" desc="Equalized-odds view">
          <div className="rounded-md border border-hairline bg-surface p-5">
            {BIAS_GROUPS.map((g) => (
              <BarRow key={g.group} label={g.group} value={g.avgScore} color={g.anomaly ? "var(--neg)" : "var(--iris-b)"} />
            ))}
          </div>
        </Section>
      </div>

      {/* heatmap */}
      <Section title="Fairness heatmap" desc="Groups × metrics — hover cells to compare" className="mt-2">
        <div className="overflow-x-auto rounded-md border border-hairline bg-surface p-5">
          <table className="w-full min-w-[520px] text-[12.5px]">
            <thead>
              <tr>
                <th className="mono-label px-3 py-2 text-left font-normal">Group</th>
                <th className="mono-label px-3 py-2 text-left font-normal">Pass rate</th>
                <th className="mono-label px-3 py-2 text-left font-normal">Avg score</th>
                <th className="mono-label px-3 py-2 text-left font-normal">Sample</th>
                <th className="mono-label px-3 py-2 text-left font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {BIAS_GROUPS.map((g) => (
                <tr key={g.group} className="border-t border-hairline">
                  <td className="px-3 py-2.5 text-text-hi">{g.group}</td>
                  <td className="px-3 py-2.5">
                    <HeatCell v={g.passRate} label={`${Math.round(g.passRate * 100)}%`} anomaly={g.anomaly} />
                  </td>
                  <td className="px-3 py-2.5">
                    <HeatCell v={g.avgScore / 100} label={`${g.avgScore}`} anomaly={g.anomaly} />
                  </td>
                  <td className="tnum mono px-3 py-2.5 text-text-mid">{g.n}</td>
                  <td className="px-3 py-2.5">
                    {g.anomaly ? (
                      <span className="mono text-[11px]" style={{ color: "var(--neg)" }}>anomaly</span>
                    ) : (
                      <span className="mono text-[11px] text-text-lo">nominal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mono mt-4 text-[11px] text-text-lo">
            Operates only on lawfully-available data, post-hoc, respecting anonymization. Concepts from Fairlearn / Aequitas.
          </p>
        </div>
      </Section>
    </div>
  );
}

function HeatCell({ v, label, anomaly }: { v: number; label: string; anomaly: boolean }) {
  const bg = anomaly ? `rgba(229,72,77,${0.15 + v * 0.3})` : `rgba(70,208,138,${0.1 + v * 0.35})`;
  return (
    <span className="mono inline-block rounded-[4px] px-2 py-1 text-[11px] text-text-hi" style={{ background: bg }}>
      {label}
    </span>
  );
}
