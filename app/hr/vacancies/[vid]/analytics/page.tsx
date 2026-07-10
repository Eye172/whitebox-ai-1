import { notFound } from "next/navigation";
import { getVacancy, SCORE_DISTRIBUTION, CRITERIA_EFFECTIVENESS } from "@/lib/fixtures";
import { PageHeader, Section } from "@/components/hr/PageHeader";
import { Histogram, Funnel, InterpretNote } from "@/components/hr/AnalyticsCharts";
import { BarRow } from "@/components/ui/viz";
import ContourBg from "@/components/ui/ContourBg";

export default async function AnalyticsPage({ params }: { params: Promise<{ vid: string }> }) {
  const { vid } = await params;
  const vacancy = getVacancy(vid);
  if (!vacancy) notFound();

  const kpis = [
    { label: "Applicants", value: vacancy.applicants },
    { label: "Interviewed", value: vacancy.funnel.find((f) => f.label === "Interview")?.value ?? 0 },
    { label: "Passed threshold", value: vacancy.passed },
    { label: "Avg score", value: vacancy.avgScore },
    { label: "Invited", value: vacancy.invited },
  ];

  return (
    <div className="relative overflow-hidden p-6 md:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72"><ContourBg opacity={0.05} /></div>
      <PageHeader title="Analytics" sub={`${vacancy.title} · ${vacancy.code}`} />

      {/* KPI strip */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-md border border-hairline bg-surface p-4">
            <div className="mono-label mb-2 truncate">{k.label}</div>
            <div className="metric text-[26px] text-text-hi">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Score distribution" desc="Click a bin to inspect the candidates in it (Microscope)">
          <div className="rounded-md border border-hairline bg-surface p-5">
            <Histogram data={SCORE_DISTRIBUTION} threshold={vacancy.threshold} />
            <InterpretNote>
              The green bins are above the {vacancy.threshold}-point pass threshold. A long left tail is normal early in a funnel.
            </InterpretNote>
          </div>
        </Section>

        <Section title="Hiring funnel" desc="Ordered stages with drop-off">
          <div className="rounded-md border border-hairline bg-surface p-5">
            <Funnel steps={vacancy.funnel} />
          </div>
        </Section>
      </div>

      <Section title="Criteria effectiveness" desc="Which evaluation criteria predict outcomes" className="mt-2">
        <div className="rounded-md border border-hairline bg-surface p-5">
          {CRITERIA_EFFECTIVENESS.map((c) => (
            <BarRow key={c.criteria} label={c.criteria} value={Math.round(c.predictive * 100)} suffix="%" color="var(--iris-c)" />
          ))}
          <InterpretNote>
            Higher-predictive criteria correlate with downstream success. Decision-making and leadership carry the most signal for this role.
          </InterpretNote>
        </div>
      </Section>
    </div>
  );
}
