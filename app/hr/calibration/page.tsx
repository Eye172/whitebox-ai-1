import { REVIEWERS } from "@/lib/fixtures";
import { PageHeader, Section } from "@/components/hr/PageHeader";
import { BarRow } from "@/components/ui/viz";
import { EyeOff, TrendingUp, AlertTriangle } from "lucide-react";

export default function CalibrationPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Calibration"
        sub="Align reviewers, remove anchoring, and watch AI↔human divergence."
      />

      {/* blind feedback explainer */}
      <div className="mb-8 flex items-start gap-3 rounded-md border border-hairline bg-surface p-4">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-iris-b" />
        <div>
          <div className="text-[13.5px] text-text-hi">Blind feedback is on</div>
          <p className="text-[12.5px] text-text-mid">
            An interviewer sees others&rsquo; feedback only after submitting their own — this removes anchoring (Ashby pattern).
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Reviewer agreement" desc="Consistency with the panel consensus">
          <div className="rounded-md border border-hairline bg-surface p-5">
            {REVIEWERS.map((r) => (
              <BarRow key={r.reviewer} label={`${r.reviewer} (${r.reviews})`} value={Math.round(r.agreement * 100)} suffix="%" color={r.agreement < 0.8 ? "var(--warn)" : "var(--pos)"} />
            ))}
          </div>
        </Section>

        <Section title="AI↔human divergence" desc="Override-rate as an operational signal">
          <div className="rounded-md border border-hairline bg-surface p-5">
            {REVIEWERS.map((r) => {
              const high = r.overrideRate > 0.2;
              const low = r.overrideRate < 0.05;
              return (
                <div key={r.reviewer} className="flex items-center gap-3 border-b border-hairline py-2.5 last:border-0">
                  <span className="w-28 shrink-0 text-[13px] text-text-mid">{r.reviewer}</span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${r.overrideRate * 100 * 2.5}%`, background: high ? "var(--neg)" : low ? "var(--warn)" : "var(--iris-b)" }} />
                  </div>
                  <span className="mono w-10 text-right text-[12px] text-text-hi">{Math.round(r.overrideRate * 100)}%</span>
                </div>
              );
            })}
            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2 text-[12px] text-text-mid">
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--neg)" }} />
                <span>M. Bianchi&rsquo;s override-rate (28%) is rising — a possible sign of model drift on this vacancy.</span>
              </div>
              <div className="flex items-start gap-2 text-[12px] text-text-mid">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--warn)" }} />
                <span>K. Sato&rsquo;s override-rate (2%) on high volume — watch for rubber-stamping; the review panel may not be engaging.</span>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* agreement heatmap */}
      <Section title="Pairwise agreement" className="mt-2">
        <div className="overflow-x-auto rounded-md border border-hairline bg-surface p-5">
          <table className="min-w-[420px] border-collapse">
            <thead>
              <tr>
                <th />
                {REVIEWERS.map((r) => (
                  <th key={r.reviewer} className="mono-label px-2 py-1 font-normal">{r.reviewer.split(" ")[1] ?? r.reviewer}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REVIEWERS.map((r, i) => (
                <tr key={r.reviewer}>
                  <td className="mono-label pr-3 text-right">{r.reviewer.split(" ")[1] ?? r.reviewer}</td>
                  {REVIEWERS.map((c, j) => {
                    const v = i === j ? 1 : Math.max(0.55, Math.min(0.98, (r.agreement + c.agreement) / 2 + (((i * 7 + j * 3) % 5) - 2) * 0.03));
                    return (
                      <td key={c.reviewer} className="p-1">
                        <div className="flex h-9 w-14 items-center justify-center rounded-[4px] text-[11px] text-text-hi" style={{ background: `rgba(123,147,255,${0.08 + v * 0.4})` }}>
                          {Math.round(v * 100)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
